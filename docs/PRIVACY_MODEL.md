# Privacy model

## Data classification

| Data | Location | Public? | Retention |
| --- | --- | --- | --- |
| Membership credential and issuer signature | Wallet/prover only | No | User-controlled local state |
| Voter secret | Wallet/prover only | No | Wallet-controlled |
| Vote choice | Witness/proof circuit only | No | Not sent to API or database |
| Ballot ID, issuer key hash, schedule | Compact public ledger | Yes | Contract lifetime |
| Eligibility result | Compact receipt | Yes | Contract lifetime |
| Nullifier | Compact public ledger | Yes, unlinkable | Contract lifetime |
| Finalized transaction ID and scope | FastAPI/Neon | Yes | Operational retention |
| Public policy request hash | FastAPI/Neon | Yes, non-reversible hash | Operational retention |

## Circuit constraints

`prove_eligibility` checks the ballot window, requested ballot, issuer signature, and membership claim while all credential values remain private. It discloses a boolean eligibility outcome only.

`cast_once` derives a ballot-domain-specific nullifier from a private secret, rejects existing values, increments the public aggregate, and discloses that nullifier only. It has no `disclose()` call for credential, signature, secret, identity, or vote choice.

## Gemini boundary

Gemini gets redacted public policy text only. The service sets `store=False`, requests a strict JSON response, validates it with Pydantic, and falls back deterministically if a key, model, network call, or validation fails. It must never receive witnesses, raw credentials, documents, identifiers, seed phrases, wallet addresses, or vote choices.

## Public API boundary

The receipt schema forbids undeclared fields and rejects known private field names. The database has no columns for private witness data. Public-API logs must be configured in production to avoid request-body logging.
