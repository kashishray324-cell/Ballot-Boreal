import hashlib
import re
from .schemas import PRIVATE_KEYS

SENSITIVE_PATTERNS = [
    re.compile(r"(?:seed phrase|mnemonic|private key)\s*[:=]?\s*[^\n,;]+", re.I),
    re.compile(r"\b0x[a-fA-F0-9]{40}\b"),
    re.compile(r"\b\d{8,}\b"),
]


def redact_sensitive_text(value: str) -> str:
    result = value
    for pattern in SENSITIVE_PATTERNS:
        result = pattern.sub("[redacted]", result)
    return result


def request_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def contains_private_field(payload: dict[str, object]) -> bool:
    return any(any(private_key in key.lower() for private_key in PRIVATE_KEYS) for key in payload)
