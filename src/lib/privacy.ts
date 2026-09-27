export const PRIVATE_FIELD_NAMES = ['seed', 'secret', 'witness', 'credential', 'document', 'identity', 'address', 'vote', 'choice', 'salary', 'bid']

const PUBLIC_TEXT_CHECKS = [
  { id: 'secret', label: 'No secret or recovery phrase', pattern: /\b(?:seed phrase|mnemonic|private key|password|wallet secret)\b/i },
  { id: 'address', label: 'No wallet address', pattern: /\b0x[a-fA-F0-9]{40}\b|\baddr1[a-zA-Z0-9]{20,}\b/i },
  { id: 'identifier', label: 'No long personal identifier', pattern: /\b\d{8,}\b/ },
] as const

export type PublicTextPreflight = {
  safe: boolean
  checks: Array<{ id: string; label: string; passed: boolean }>
  sanitized: string
}

export type PublicReceipt = { txId: string; ballotId: string; network: 'preview' | 'preprod'; outcome: 'accepted'; finalizedAt: string; nullifier: string }

export function hasPrivateFields(input: Record<string, unknown>): boolean {
  return Object.keys(input).some((key) => PRIVATE_FIELD_NAMES.some((privateName) => key.toLowerCase().includes(privateName)))
}

export function redactPublicText(input: string): string {
  return input
    .replace(/(?:seed phrase|mnemonic|private key)\s*[:=]?\s*[^\n,;]+/gi, '[redacted secret]')
    .replace(/\b0x[a-fA-F0-9]{40}\b/g, '[redacted address]')
    .replace(/\b\d{8,}\b/g, '[redacted identifier]')
}

export function assessPublicText(input: string): PublicTextPreflight {
  const checks = PUBLIC_TEXT_CHECKS.map(({ id, label, pattern }) => ({ id, label, passed: !pattern.test(input) }))
  return { safe: checks.every((check) => check.passed), checks, sanitized: redactPublicText(input) }
}

export function validateReceipt(value: unknown): value is PublicReceipt {
  if (!value || typeof value !== 'object' || hasPrivateFields(value as Record<string, unknown>)) return false
  const receipt = value as Record<string, unknown>
  return typeof receipt.txId === 'string' && typeof receipt.ballotId === 'string' && (receipt.network === 'preview' || receipt.network === 'preprod') && receipt.outcome === 'accepted' && typeof receipt.finalizedAt === 'string' && typeof receipt.nullifier === 'string'
}
