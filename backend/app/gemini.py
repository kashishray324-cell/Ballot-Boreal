import json
from google import genai
from .config import get_settings
from .privacy import redact_sensitive_text
from .schemas import PolicyPlanOut


def fallback_plan(public_requirement: str) -> PolicyPlanOut:
    return PolicyPlanOut(
        summary=f"This ballot requires: {public_requirement[:220]}",
        disclosures=["Eligibility is valid", "One-time nullifier"],
        private_by_default=["Credential contents", "Identity", "Vote selection", "Wallet-held proving material"],
        caution="Only public policy text was reviewed. Verify the issuer and deadline before proving.",
        source="local-fallback",
    )


async def compose_policy_plan(public_requirement: str) -> PolicyPlanOut:
    clean = redact_sensitive_text(public_requirement)
    settings = get_settings()
    if not settings.gemini_api_key:
        return fallback_plan(clean)
    schema = PolicyPlanOut.model_json_schema()
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        interaction = await client.aio.interactions.create(
            model=settings.gemini_model,
            input=("Explain this PUBLIC voting policy. Never request or infer credentials, secrets, wallet "
                   f"addresses, identity, or vote choices. Policy: {clean}"),
            response_format={"type": "text", "mime_type": "application/json", "schema": schema},
            store=False,
        )
        parsed = json.loads(interaction.output_text)
        parsed["source"] = "gemini"
        return PolicyPlanOut.model_validate(parsed)
    except Exception:
        return fallback_plan(clean)
