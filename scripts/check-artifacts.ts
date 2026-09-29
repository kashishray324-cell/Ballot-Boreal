import { existsSync } from 'node:fs'
const directory = 'contracts/artifacts'
const required = [
  'contract/index.js',
  'contract/index.d.ts',
  'keys/proveEligibility.prover',
  'keys/proveEligibility.verifier',
  'keys/castOnce.prover',
  'keys/castOnce.verifier',
  'zkir/proveEligibility.bzkir',
  'zkir/castOnce.bzkir',
]
if (!existsSync(directory)) throw new Error('No generated Compact artifacts found. Run the official Compact compiler first.')
const missing = required.filter((file) => !existsSync(`${directory}/${file}`))
if (missing.length) throw new Error(`Compact artifacts are incomplete: ${missing.join(', ')}`)
console.log(`Verified ${required.length} required Compact artifacts.`)
