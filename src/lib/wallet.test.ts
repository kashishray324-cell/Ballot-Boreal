import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { connectWallet, describeWalletError, discoverWallets, submitProof } from './wallet'

function connectedApi(networkId: string, address = 'mn_addr_test'): ConnectedAPI {
  return {
    getConnectionStatus: vi.fn().mockResolvedValue({ status: 'connected', networkId }),
    getConfiguration: vi.fn().mockResolvedValue({ networkId, indexerUri: '', indexerWsUri: '', substrateNodeUri: '' }),
    getUnshieldedAddress: vi.fn().mockResolvedValue({ unshieldedAddress: address }),
  } as unknown as ConnectedAPI
}

function initialApi(name: string, connect = vi.fn().mockResolvedValue(connectedApi('preview'))): InitialAPI {
  return { name, rdns: `app.${name.toLowerCase()}`, icon: '', apiVersion: '4.0.1', connect }
}

describe('Midnight wallet discovery', () => {
  afterEach(() => { delete window.midnight })

  it('discovers compatible UUID-keyed providers and prefers 1AM', () => {
    window.midnight = { other: initialApi('Other'), 'uuid-1': initialApi('1AM Wallet'), legacy: { ...initialApi('Legacy'), apiVersion: '3.0.0' } }
    expect(discoverWallets().map((wallet) => wallet.id)).toEqual(['uuid-1', 'other'])
  })

  it('passes the v4 network string and returns the connected wallet address', async () => {
    const connect = vi.fn().mockResolvedValue(connectedApi('preprod', 'mn_addr_preprod'))
    window.midnight = { a: initialApi('1AM', connect) }
    await expect(connectWallet('preprod')).resolves.toMatchObject({ address: 'mn_addr_preprod', name: '1AM' })
    expect(connect).toHaveBeenCalledWith('preprod')
  })

  it('rejects an actual connected-network mismatch', async () => {
    window.midnight = { a: initialApi('1AM', vi.fn().mockResolvedValue(connectedApi('preview'))) }
    await expect(connectWallet('preprod')).rejects.toThrow('Network mismatch')
  })

  it('never manufactures a transaction without a circuit submitter', async () => await expect(submitProof(connectedApi('preview'), 'ballot', 'preview')).rejects.toThrow('No transaction was created'))
  it('turns known wallet failures into an actionable recovery message', () => expect(describeWalletError(new Error('insufficient DUST balance'))).toContain('DUST'))
  it('separates indexer outages from a network mismatch', () => {
    expect(describeWalletError(new Error('indexer unavailable'))).toContain('indexer')
    expect(describeWalletError(new Error('wrong network selected'))).toContain('does not match')
  })
  it('explains extension broadcast failures without blaming Midnight', () => expect(describeWalletError(new Error('Broadcast channel unavailable'))).toContain('browser wallet extension'))
})
