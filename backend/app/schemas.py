from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator

PRIVATE_KEYS = {"witness", "secret", "credential", "identity", "vote", "choice", "seed", "document", "address"}


class StrictPublicModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProofReceiptIn(StrictPublicModel):
    tx_id: str = Field(min_length=8, max_length=128)
    ballot_id: str = Field(min_length=3, max_length=128)
    network: Literal["preview", "preprod"]
    nullifier: str = Field(min_length=16, max_length=128)
    outcome: Literal["accepted"]

    @field_validator("tx_id", "ballot_id", "nullifier")
    @classmethod
    def reject_private_terms(cls, value: str) -> str:
        lowered = value.lower()
        if any(term in lowered for term in ("seed", "secret", "credential", "witness", "vote")):
            raise ValueError("private material is not valid in a public receipt")
        return value


class ProofReceiptOut(ProofReceiptIn):
    finalized_at: datetime


class PolicyRequest(StrictPublicModel):
    public_requirement: str = Field(min_length=8, max_length=1500)


class PolicyPlanOut(StrictPublicModel):
    summary: str
    disclosures: list[str]
    private_by_default: list[str]
    caution: str
    source: Literal["gemini", "local-fallback"]
