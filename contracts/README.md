# Compact contract

`BallotBoreal.compact` stores public ballot configuration, an authority-published eligibility Merkle root, an aggregate proof count, and replay-safe nullifiers. The member secret and eight-level Merkle path are a private witness resolved by the browser proving context.

## Disclosure justification

| Value | Why it is public |
| --- | --- |
| Eligibility result | The verifier learns only that the private member commitment opens to the published root. |
| `nullifier` | The ledger must identify a second submission for the same ballot without learning the voter identity or stable member commitment. |

No vote selection, member secret, Merkle leaf, path, or wallet secret is disclosed. `castOnce` protects the public aggregate from replay by rejecting an already-recorded ballot-scoped nullifier.

## Compile

Install the official Compact compiler for the target Preview/Preprod release, then run:

```sh
compact compile contracts/BallotBoreal.compact contracts/artifacts
```

Generated proving artifacts belong in `contracts/artifacts/`. The Vite build publishes `keys/` and `zkir/` from this directory so 1AM can prove the real circuit in the browser.
