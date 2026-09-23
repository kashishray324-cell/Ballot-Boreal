# Compact contract

`BallotBoreal.compact` is intentionally limited to public ballot configuration, an aggregate proof count, and replay-safe nullifiers. `membership_credential`, its signature, and `voter_secret` are private witnesses resolved by the user wallet's proving context.

## Disclosure justification

| Value | Why it is public |
| --- | --- |
| `eligible` | The verifier must learn that the public rule was satisfied, but not the credential claims that satisfied it. |
| `nullifier` | The ledger must identify a second submission for the same ballot without learning the voter identity. |

No vote selection, credential, identifier, or wallet secret is disclosed. `cast_once` protects the public aggregate from replay by rejecting an already-recorded nullifier.

## Compile

Install the official Compact compiler for the target Preview/Preprod release, then run:

```sh
compactc contracts/BallotBoreal.compact --output contracts/artifacts
```

Generated proving artifacts belong in `contracts/artifacts/` and must be reviewed before committing. This repository deliberately does not fabricate generated artifacts when a compatible compiler is unavailable locally.
