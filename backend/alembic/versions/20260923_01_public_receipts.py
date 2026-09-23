"""create public receipt and policy plan tables

Revision ID: 20260923_01
Revises:
Create Date: 2026-09-23
"""
from alembic import op
import sqlalchemy as sa

revision = "20260923_01"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("proof_receipts", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("tx_id", sa.String(128), nullable=False, unique=True), sa.Column("ballot_id", sa.String(128), nullable=False), sa.Column("network", sa.String(16), nullable=False), sa.Column("nullifier", sa.String(128), nullable=False, unique=True), sa.Column("disclosure_scope", sa.Text(), nullable=False), sa.Column("finalized_at", sa.DateTime(timezone=True), nullable=False))
    op.create_table("policy_plans", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("request_hash", sa.String(64), nullable=False, unique=True), sa.Column("plan_json", sa.Text(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))

def downgrade():
    op.drop_table("policy_plans")
    op.drop_table("proof_receipts")
