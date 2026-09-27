# Ballot Boreal

> A privacy-first civic ballot: prove eligibility once, without turning a voter into a public record.

[![CI](https://github.com/kashishray324-cell/Ballot-Boreal/actions/workflows/ci.yml/badge.svg)](https://github.com/kashishray324-cell/Ballot-Boreal/actions/workflows/ci.yml)

Ballot Boreal is a Midnight dApp prototype for housing cooperatives, campus bodies, and member associations. A voter proves an issuer-signed eligibility credential locally, obtains an anonymous one-time nullifier, and submits a Compact circuit. The ledger receives an eligibility outcome, a nullifier, and public ballot state—never the credential, identity, or vote choice.

The interface uses Nordic civic minimalism: quiet mineral surfaces, evergreen ink, paper-like rules, deliberate state labels, and a disclosure-first voter journey. It is designed for people who have never used a zero-knowledge proof before.

## Why Midnight

Traditional online voting forces a poor choice: put identity-linked eligibility on a server, or weaken duplicate-vote controls. Midnight’s selective-disclosure model lets the contract verify a private credential and expose only a public eligibility result plus a replay-safe nullifier. That is a functional requirement, not visual crypto branding. See the [Midnight developer documentation](https://docs.midnight.network/) for the platform’s privacy and selective-disclosure model.

## Privacy model

| An observer can learn | An observer cannot learn |
| --- | --- |
| Ballot ID, opening/closing schedule, issuer key hash | Voter identity or wallet-held proving material |
| A valid eligibility proof was accepted | Credential contents, membership details, expiry data |
| A one-time nullifier and total finalized proof count | The relationship between a nullifier and an individual |
| A finalized transaction ID and the permitted disclosure scope | Vote choice or raw eligibility record |

`disclose(eligible)` is justified because the verifier needs the policy outcome only. `disclose(nullifier)` is justified because the ledger needs to reject a replay. No other witness value is intentionally disclosed. See [docs/PRIVACY_MODEL.md](docs/PRIVACY_MODEL.md).

## Architecture

```text
React + local private state ── 1AM / Midnight DApp Connector ── Compact contract
        │                                  │                         │
        ├─ local witness only               └─ Preview / Preprod       └─ public aggregate + nullifiers
        │
        └─ FastAPI public API ── Neon Postgres
                    └─ Gemini (public policy text only; server-side key; structured output)
```

The API uses a pooled Neon URL for normal runtime traffic and a direct URL for migrations. Neon branches are isolated and have distinct connection strings, which supports a branch-first production/development workflow. [Neon’s workflow primer](https://neon.com/docs/get-started-with-neon/workflow-primer) and [connection guidance](https://neon.com/blog/inside-lubots-database-per-tenant-architecture) describe that separation.

Gemini is optional. When configured, the API uses the official `google-genai` SDK’s structured output and validates every result with Pydantic. It sends public policy wording only, with sensitive-pattern redaction and `store=False`; otherwise it takes a deterministic local fallback. The official SDK is the recommended production library, and structured output still requires application validation. [Gemini SDK documentation](https://ai.google.dev/gemini-api/docs/libraries) and [structured-output guide](https://ai.google.dev/gemini-api/docs/structured-output).

## Repository structure

```text
src/                 React app, wallet discovery, local witness metadata, UI tests
contracts/           Compact source, privacy rationale, generated-artifact destination
backend/app/         FastAPI API, async SQLAlchemy models, Gemini boundary service
backend/alembic/     Initial public-only database migration
netlify/functions/   Netlify-native TypeScript adapter for the public API routes
docs/                Product, architecture, privacy, and demo documentation
.github/workflows/   CI and GitHub Pages deployment workflow
```

## Local setup

Requirements: Node 22, npm, Python 3.11+, [uv](https://docs.astral.sh/uv/), a 1AM wallet, the official Compact compiler matching the target Midnight release, and optionally Docker.

```sh
cp .env.example .env
npm ci
uv sync --directory backend --all-groups
npm run dev
uv run --directory backend uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:5173`. The API is available at `http://localhost:8000/docs` in development.

### Wallet and networks

The frontend discovers UUID-keyed providers from `window.midnight`, sorts 1AM first, and connects with the selected Preview or Preprod network. Switching networks clears the session-level wallet connection. The proof button never creates a synthetic transaction: it only calls a provider that exposes the Ballot Boreal circuit submitter, and waits for a real transaction identifier before a pending receipt state appears.

### Compact and proof server

Compile with the official compiler version compatible with your target:

```sh
compactc contracts/BallotBoreal.compact --output contracts/artifacts
npm run contract:validate
docker compose -f docker-compose.prover.yml up
```

Set `MIDNIGHT_PROOF_SERVER_IMAGE` to the compatible official proof-server image. Generated browser/proving artifacts are intentionally not faked; compile and review them before committing. `contracts/README.md` records the contract boundary and disclosures.

### Neon and Gemini

Create `production` and `development` Neon branches. Set `DATABASE_URL` to the pooled connection string for API traffic and `DATABASE_DIRECT_URL` to the direct connection string for Alembic operations. The database schema stores only public metadata, receipts, scope, aggregate counts, and hashes of public policy requests.

Set `GEMINI_API_KEY` only in backend deployment secrets. Gemini never receives a private witness, seed phrase, identity document, exact attribute, vote selection, or wallet address. Without it, the deterministic local fallback stays available.

## Verification

```sh
npm run contract:validate
npm test
npm run lint
npm run build
uv run --directory backend ruff check .
uv run --directory backend pytest
```

The repository currently has 19 useful tests: Compact boundary assertions; redaction; receipt validation; local witness persistence and rotation; provider discovery; network selection; actionable wallet recovery; no-fake-transaction handling; responsive voter rendering; FastAPI health and database availability; Gemini fallback; public-policy hash caching; public receipt storage, privacy checks, and aggregation.

## Netlify deployment

This repository is configured as one Netlify site. Vite publishes the frontend from `dist/`, while the Netlify-native TypeScript function in `netlify/functions/api.mts` serves `/api/health`, `/api/metrics`, `/api/policy-plan`, and `/api/receipts`. The existing FastAPI application remains available for local development or separate backend hosting.

1. Import `kashishray324-cell/Ballot-Boreal` into Netlify with the repository root as the base directory. Netlify reads `netlify.toml`; no build-setting overrides are required.
2. In **Project configuration → Environment variables**, add `DATABASE_URL` using the pooled Neon Postgres URL, `GEMINI_API_KEY` if desired, `GEMINI_MODEL=gemini-2.5-flash`, `ALLOWED_ORIGINS=https://YOUR-SITE.netlify.app`, and `ENVIRONMENT=production`. Do not put secrets in `netlify.toml` or a `VITE_*` variable.
3. Run the existing Alembic migration once against `DATABASE_DIRECT_URL` before the production deploy: `uv run --directory backend alembic upgrade head`.
4. Deploy and open `/api/health`. It should return `{"status":"ok","database":true}` before connecting a wallet.

The frontend uses same-origin `/api` by default, so `VITE_API_URL` should be left unset in Netlify. Netlify does not supply a compatible Midnight proof service; deploy that separately only after choosing the official compiler/proof-server release.

## CI/CD

Every push and pull request runs Node 22 install, Python/uv setup, Compact compilation, artifact-diff checking, contract validation, frontend lint/tests/build, and backend lint/tests. Set the repository variable `COMPACTC_INSTALL_URL` to a pinned official compiler archive before enabling CI. Netlify handles production deployment from the connected Git repository.

**Live demo:** not deployed yet. **Repository:** [kashishray324-cell/Ballot-Boreal](https://github.com/kashishray324-cell/Ballot-Boreal).

## Limitations and next steps

- A real 1AM provider and a deployed Compact contract address are required to send a transaction.
- The included source is privacy-reviewed but needs a compatible official Compact compiler run before generated artifacts can be committed.
- Production needs issuer-key rotation, independent contract audit, election-opening governance, accessibility testing with voters, and a result-opening circuit appropriate to the ballot rules.

See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for a one-minute walkthrough and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system decisions.
