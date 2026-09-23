import { existsSync, readdirSync } from 'node:fs'
const directory = 'contracts/artifacts'
if (!existsSync(directory)) throw new Error('No generated Compact artifacts found. Run the official compactc compiler first.')
const files = readdirSync(directory).filter((file) => !file.startsWith('.'))
if (!files.length) throw new Error('Compact artifacts directory is empty. Generated artifacts are required for browser proving.')
console.log(`Verified ${files.length} Compact artifacts.`)
