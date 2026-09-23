from app.gemini import fallback_plan
from app.privacy import contains_private_field, redact_sensitive_text, request_hash
from app.schemas import ProofReceiptIn
import pytest
from pydantic import ValidationError


def test_redacts_seed_phrase_and_address():
    result = redact_sensitive_text("seed phrase: willow lake 0x1234567890abcdef1234567890abcdef12345678")
    assert "willow" not in result and "0x" not in result


def test_hash_is_deterministic_and_not_raw_text():
    assert request_hash("public policy") == request_hash("public policy")
    assert "public policy" not in request_hash("public policy")


def test_private_field_detection():
    assert contains_private_field({"credential_secret": "nope"})
    assert not contains_private_field({"tx_id": "abc"})


def test_receipt_rejects_private_content():
    with pytest.raises(ValidationError):
        ProofReceiptIn(tx_id="tx-secret-123", ballot_id="ballot", network="preview", nullifier="n" * 16, outcome="accepted")


def test_gemini_fallback_has_explicit_boundary():
    plan = fallback_plan("active member before deadline")
    assert plan.source == "local-fallback"
    assert "Identity" in plan.private_by_default
