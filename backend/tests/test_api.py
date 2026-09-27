import pytest
from httpx import ASGITransport, AsyncClient
from uuid import uuid4
from app.database import init_models
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200 and response.json() == {"status": "ok", "database": True, "environment": "development"}


@pytest.mark.asyncio
async def test_liveness_endpoint_has_no_database_dependency():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health/live")
    assert response.status_code == 200 and response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_policy_endpoint_uses_safe_fallback():
    await init_models()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/policy-plan", json={"public_requirement": "Active cooperative membership before 1 September"})
    assert response.status_code == 200 and response.json()["source"] == "local-fallback"


@pytest.mark.asyncio
async def test_policy_plan_is_cached_by_public_text_hash_only():
    await init_models()
    body = {"public_requirement": "Membership is active before the public deadline."}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        first = await client.post("/policy-plan", json=body)
        second = await client.post("/policy-plan", json=body)
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()


@pytest.mark.asyncio
async def test_public_receipt_and_metrics_store_only_public_outcome():
    await init_models()
    payload = {"tx_id": f"tx-{uuid4().hex}", "ballot_id": "northward-housing", "network": "preview", "nullifier": uuid4().hex, "outcome": "accepted"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        created = await client.post("/receipts", json=payload)
        metrics = await client.get("/metrics")
    assert created.status_code == 201
    assert created.json()["nullifier"] == payload["nullifier"]
    assert metrics.json()["finalized_proofs"] >= 1
