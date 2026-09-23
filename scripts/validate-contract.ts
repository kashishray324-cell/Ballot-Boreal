import { readFileSync } from 'node:fs'

const source = readFileSync('contracts/BallotBoreal.compact', 'utf8')
const required = ['ledger ballot_id', 'witness membership_credential', 'circuit prove_eligibility', 'circuit cast_once', 'disclose(eligible)', 'disclose(nullifier)', 'used_nullifiers', 'verify_issuer_signature']
const missing = required.filter((term) => !source.includes(term))
if (missing.length) throw new Error(`Compact privacy boundary missing: ${missing.join(', ')}`)
if (/disclose\((credential|voter_secret|signature)\)/.test(source)) throw new Error('Private witness disclosure is prohibited')
console.log('Contract privacy-boundary validation passed.')
