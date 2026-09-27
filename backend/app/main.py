from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from .config import get_settings
from .database import database_is_available, get_session, init_models
from .gemini import compose_policy_plan
from .models import PolicyPlan, ProofReceipt
from .privacy import contains_private_field, request_hash
from .schemas import PolicyPlanOut, PolicyRequest, ProofReceiptIn, ProofReceiptOut


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_models()
    yield


settings = get_settings()
app = FastAPI(title="Ballot Boreal Public API", version="0.1.0", lifespan=lifespan, docs_url="/docs" if settings.environment == "development" else None)
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])
app.add_middleware(GZipMiddleware, minimum_size=500)


@app.middleware("http")
async def add_public_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store" if request.url.path.startswith("/receipts") else "public, max-age=60"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


@app.get("/health")
async def health(response: Response):
    database = await database_is_available()
    if not database:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"status": "ok" if database else "degraded", "database": database, "environment": settings.environment}


@app.get("/health/live")
async def liveness():
    """A dependency-free probe so a temporary database outage does not restart the API."""
    return {"status": "ok"}


@app.get("/metrics")
async def metrics(session: AsyncSession = Depends(get_session)):
    count = (await session.execute(select(func.count()).select_from(ProofReceipt))).scalar_one()
    return {"finalized_proofs": count, "public_only": True}


@app.post("/policy-plan", response_model=PolicyPlanOut)
async def policy_plan(request: PolicyRequest, session: AsyncSession = Depends(get_session)):
    # The raw public requirement is deliberately not persisted; only its hash and safe response are retained.
    key = request_hash(request.public_requirement)
    existing = await session.scalar(select(PolicyPlan).where(PolicyPlan.request_hash == key))
    if existing:
        return PolicyPlanOut.model_validate_json(existing.plan_json)
    plan = await compose_policy_plan(request.public_requirement)
    session.add(PolicyPlan(request_hash=key, plan_json=plan.model_dump_json()))
    try:
        await session.commit()
    except Exception:
        await session.rollback()
    return plan


@app.post("/receipts", response_model=ProofReceiptOut, status_code=201)
async def create_receipt(receipt: ProofReceiptIn, session: AsyncSession = Depends(get_session)):
    if contains_private_field(receipt.model_dump()):
        raise HTTPException(422, "Private fields are prohibited in public receipts")
    entry = ProofReceipt(**receipt.model_dump(exclude={"outcome"}), finalized_at=datetime.now(timezone.utc))
    session.add(entry)
    try:
        await session.commit()
    except Exception as error:
        await session.rollback()
        raise HTTPException(409, "Duplicate transaction or nullifier") from error
    return ProofReceiptOut(**receipt.model_dump(), finalized_at=entry.finalized_at)
