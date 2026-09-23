from datetime import datetime
from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class ProofReceipt(Base):
    __tablename__ = "proof_receipts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tx_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    ballot_id: Mapped[str] = mapped_column(String(128), index=True)
    network: Mapped[str] = mapped_column(String(16))
    nullifier: Mapped[str] = mapped_column(String(128), unique=True)
    disclosure_scope: Mapped[str] = mapped_column(Text, default="eligibility_valid,nullifier")
    finalized_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PolicyPlan(Base):
    __tablename__ = "policy_plans"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    plan_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
