import { describe, expect, it } from 'vitest'
import { assessPublicText, hasPrivateFields, redactPublicText, validateReceipt } from './privacy'

describe('public receipt boundary', () => {
  it('rejects a receipt with a private field', () => expect(hasPrivateFields({ witness: 'secret' })).toBe(true))
  it('accepts the intentional public receipt shape', () => expect(validateReceipt({ txId: 'tx-12345678', ballotId: 'ballot', network: 'preview', outcome: 'accepted', finalizedAt: '2026-09-23T00:00:00Z', nullifier: 'n'.repeat(24) })).toBe(true))
  it('redacts obvious sensitive public-policy input', () => expect(redactPublicText('seed phrase: alpha beta\n0x1234567890123456789012345678901234567890')).not.toContain('alpha'))
  it('passes civic policy text and blocks private-looking content locally', () => {
    expect(assessPublicText('Active membership issued before 1 September 2026').safe).toBe(true)
    const unsafe = assessPublicText('private key: alpha beta and 0x1234567890123456789012345678901234567890')
    expect(unsafe.safe).toBe(false)
    expect(unsafe.checks.filter((check) => !check.passed)).toHaveLength(2)
  })
})
