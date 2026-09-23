from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from .config import get_settings
from .database import get_session, init_models
from .gemini import compose_policy_plan
from .models import ProofReceipt
from .privacy import contains_private_field
from .schemas import PolicyPlanOut, PolicyRequest, ProofReceiptIn, ProofReceiptOut


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_models()
    yield


settings = get_settings()
app = FastAPI(title="Ballot Boreal Public API", version="0.1.0", lifespan=lifespan, docs_url="/docs" if settings.environment == "development" else None)
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


@app.get("/health")
async def health():
    return {"status": "ok", "environment": settings.environment}


@app.get("/metrics")
async def metrics(session: AsyncSession = Depends(get_session)):
    count = (await session.execute(select(func.count()).select_from(ProofReceipt))).scalar_one()
    return {"finalized_proofs": count, "public_only": True}


@app.post("/policy-plan", response_model=PolicyPlanOut)
async def policy_plan(request: PolicyRequest):
    return await compose_policy_plan(request.public_requirement)


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
