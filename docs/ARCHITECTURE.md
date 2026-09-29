# Architecture

## Components

1. **Vite/React client** — renders the disclosure-first voter experience and keeps the private member secret and Merkle path in local browser state.
2. **Wallet adapter** — reads UUID-keyed providers from `window.midnight`, prefers 1AM, binds a session to Preview or Preprod, and exposes the connector's proving, balancing, and submission services to Midnight.js.
3. **Compact contract** — owns the public ballot ID, authority membership root, proof aggregate, and used ballot-scoped nullifiers. Two compiled circuits receive the membership witness through the local proving context.
4. **1AM proving provider** — receives generated prover/verifier keys and ZKIR from the frontend build and proves without sending the private witness to the public API.
5. **FastAPI** — provides only public metrics, public receipt storage, health, and a bounded public-policy assistant.
6. **Neon** — production and development branches; pooled runtime URL and direct migration URL.

## Network flow

```text
Voter prepares local Merkle witness → 1AM proving provider generates proof → Compact validates private constraints
    → public eligibility/nullifier accepted → network finalizes → client posts public receipt metadata
```

If proof generation, indexer access, DUST balance, or wallet approval fails, the client reports the failure and does not show a finalized receipt. Network switching resets the wallet session to prevent cross-network confusion.
