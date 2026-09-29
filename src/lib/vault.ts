const KEY = 'ballot-boreal:local-witness:v1'
export type LocalWitnessRecord = {
  version: number
  label: string
  rotatedAt: string
  secret: number[]
  siblings: number[][]
  siblingOnLeft: boolean[]
}

function randomBytes(length: number): number[] {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
}

function isWitnessRecord(value: unknown): value is LocalWitnessRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<LocalWitnessRecord>
  return typeof record.version === 'number'
    && typeof record.label === 'string'
    && typeof record.rotatedAt === 'string'
    && Array.isArray(record.secret) && record.secret.length === 32
    && Array.isArray(record.siblings) && record.siblings.length === 8
    && record.siblings.every((sibling) => Array.isArray(sibling) && sibling.length === 32)
    && Array.isArray(record.siblingOnLeft) && record.siblingOnLeft.length === 8
}

export function loadLocalWitness(): LocalWitnessRecord | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isWitnessRecord(parsed) ? parsed : null
  } catch { return null }
}

export function replaceLocalWitness(label: string): LocalWitnessRecord {
  const current = loadLocalWitness()
  const directionBytes = randomBytes(8)
  const result: LocalWitnessRecord = {
    version: (current?.version ?? 0) + 1,
    label,
    rotatedAt: new Date().toISOString(),
    secret: randomBytes(32),
    siblings: Array.from({ length: 8 }, () => randomBytes(32)),
    siblingOnLeft: directionBytes.map((value) => (value & 1) === 1),
  }
  localStorage.setItem(KEY, JSON.stringify(result))
  return result
}

export function importLocalWitness(serialized: string): LocalWitnessRecord {
  const parsed: unknown = JSON.parse(serialized)
  if (!isWitnessRecord(parsed)) throw new Error('The selected file is not a valid Ballot Boreal membership proof.')
  localStorage.setItem(KEY, JSON.stringify(parsed))
  return parsed
}

export function clearLocalWitness() { localStorage.removeItem(KEY) }
