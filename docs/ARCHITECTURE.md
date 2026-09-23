# Architecture

## Components

1. **Vite/React client** — renders the disclosure-first voter experience, keeps private witness material out of network state, and persists only non-sensitive local record metadata.
2. **Wallet adapter** — reads UUID-keyed providers from `window.midnight`, prefers 1AM, binds a session to Preview or Preprod, and does not fabricate a receipt.
3. **Compact contract** — owns public ballot metadata, proof aggregate, and used nullifiers. It receives private witnesses through the proving context.
4. **Proof service** — run from Docker using a compiler-compatible official image and the generated artifacts.
5. **FastAPI** — provides only public metrics, public receipt storage, health, and a bounded public-policy assistant.
6. **Neon** — production and development branches; pooled runtime URL and direct migration URL.

## Network flow

```text
Voter chooses local credential → wallet generates proof → Compact validates private constraints
    → public eligibility/nullifier accepted → network finalizes → client posts public receipt metadata
```

If proof generation, indexer access, DUST balance, or wallet approval fails, the client reports the failure and does not show a finalized receipt. Network switching resets the wallet session to prevent cross-network confusion.
