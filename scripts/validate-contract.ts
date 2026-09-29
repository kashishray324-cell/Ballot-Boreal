import { readFileSync } from 'node:fs'

const source = readFileSync('contracts/BallotBoreal.compact', 'utf8')
const required = [
  'ledger ballotId',
  'ledger membershipRoot',
  'witness membershipWitness',
  'circuit proveEligibility',
  'circuit castOnce',
  'disclose(true)',
  'disclose(nullifier)',
  'usedNullifiers',
  'memberRoot(witnessData)',
]
const missing = required.filter((term) => !source.includes(term))
if (missing.length) throw new Error(`Compact privacy boundary missing: ${missing.join(', ')}`)
if (/disclose\((secret|witnessData|siblings|membershipWitness)\)/.test(source)) throw new Error('Private membership witness disclosure is prohibited')
console.log('Contract privacy-boundary validation passed.')
