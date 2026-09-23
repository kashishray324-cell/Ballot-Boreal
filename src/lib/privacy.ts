export const PRIVATE_FIELD_NAMES = ['seed', 'secret', 'witness', 'credential', 'document', 'identity', 'address', 'vote', 'choice', 'salary', 'bid']

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

export function validateReceipt(value: unknown): value is PublicReceipt {
  if (!value || typeof value !== 'object' || hasPrivateFields(value as Record<string, unknown>)) return false
  const receipt = value as Record<string, unknown>
  return typeof receipt.txId === 'string' && typeof receipt.ballotId === 'string' && (receipt.network === 'preview' || receipt.network === 'preprod') && receipt.outcome === 'accepted' && typeof receipt.finalizedAt === 'string' && typeof receipt.nullifier === 'string'
}
