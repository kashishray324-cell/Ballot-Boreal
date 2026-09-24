import { afterEach, describe, expect, it } from 'vitest'
import { connectWallet, describeWalletError, discoverWallets, submitProof } from './wallet'

describe('Midnight wallet discovery', () => {
  afterEach(() => { delete window.midnight })
  it('discovers UUID-keyed providers and prefers 1AM', () => { window.midnight = { other: { name: 'Other' }, 'uuid-1': { name: '1AM Wallet' } }; expect(discoverWallets()[0].id).toBe('uuid-1') })
  it('passes selected network to the provider', async () => { const connect = async ({ network }: { network: 'preview' | 'preprod' } = { network: 'preview' }) => ({ address: network }); window.midnight = { a: { name: '1AM', connect } }; await expect(connectWallet('preprod')).resolves.toMatchObject({ address: 'preprod' }) })
  it('never manufactures a transaction without a circuit submitter', async () => await expect(submitProof({}, 'ballot', 'preview')).rejects.toThrow('No transaction was created'))
  it('turns known wallet failures into an actionable recovery message', () => expect(describeWalletError(new Error('insufficient DUST balance'))).toContain('DUST'))
})
