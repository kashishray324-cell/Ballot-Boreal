const KEY = 'ballot-boreal:local-witness:v1'
export type LocalWitnessRecord = { version: number; label: string; rotatedAt: string }

export function loadLocalWitness(): LocalWitnessRecord | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as LocalWitnessRecord } catch { return null }
}

export function replaceLocalWitness(label: string): LocalWitnessRecord {
  const current = loadLocalWitness()
  const result = { version: (current?.version ?? 0) + 1, label, rotatedAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify(result))
  return result
}

export function clearLocalWitness() { localStorage.removeItem(KEY) }
