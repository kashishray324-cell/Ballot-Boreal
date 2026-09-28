import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api'

export type Network = 'preview' | 'preprod'
export type MidnightProvider = ConnectedAPI & {
  disconnect?: () => Promise<void>
  submitBallotProof?: (payload: { ballotId: string; network: Network }) => Promise<{ txId: string }>
}

type DiscoveredWallet = { id: string; provider: InitialAPI }

function supportsCurrentConnector(provider: InitialAPI): boolean {
  return provider.apiVersion.split('.')[0] === '4'
}

export function discoverWallets(): DiscoveredWallet[] {
  return Object.entries(window.midnight ?? {})
    .map(([id, provider]) => ({ id, provider }))
    .filter(({ provider }) => supportsCurrentConnector(provider))
    .sort((a, b) => Number(b.provider.name.toLowerCase().includes('1am')) - Number(a.provider.name.toLowerCase().includes('1am')))
}

async function readDisplayAddress(provider: ConnectedAPI): Promise<string | undefined> {
  try { return (await provider.getUnshieldedAddress()).unshieldedAddress } catch { /* permission is optional */ }
  try { return (await provider.getShieldedAddresses()).shieldedAddress } catch { /* permission is optional */ }
  return undefined
}

export async function connectWallet(network: Network) {
  const wallet = discoverWallets()[0]
  if (!wallet) throw new Error('No compatible Midnight wallet was found. Update or unlock 1AM, then try again.')

  // DApp Connector v4 accepts a network ID string, not an options object.
  const connected = await wallet.provider.connect(network)
  const status = await connected.getConnectionStatus()
  if (status.status !== 'connected') throw new Error('The wallet disconnected before authorization finished.')
  if (status.networkId.toLowerCase() !== network) {
    throw new Error(`Network mismatch: the wallet connected to ${status.networkId}, but this ballot uses ${network}.`)
  }

  const configuration = await connected.getConfiguration()
  if (configuration.networkId.toLowerCase() !== network) {
    throw new Error(`Network mismatch: wallet services use ${configuration.networkId}, but this ballot uses ${network}.`)
  }

  return {
    id: wallet.id,
    provider: connected as MidnightProvider,
    name: wallet.provider.name,
    address: await readDisplayAddress(connected),
  }
}

export async function submitProof(provider: MidnightProvider, ballotId: string, network: Network) {
  if (!provider.submitBallotProof) throw new Error('This wallet cannot submit the Ballot Boreal Compact circuit yet. No transaction was created.')
  return provider.submitBallotProof({ ballotId, network })
}

function walletErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return typeof error === 'string' ? error : ''
}

export function describeWalletError(error: unknown): string {
  const originalMessage = walletErrorMessage(error)
  const message = originalMessage.toLowerCase()
  if (message.includes('reject') || message.includes('denied') || message.includes('permissionrejected')) return 'You declined the wallet request. Nothing was submitted.'
  if (message.includes('dust') || message.includes('balance')) return 'Your wallet needs sufficient DUST before it can submit this proof.'
  if (message.includes('prover') || message.includes('proof service')) return 'The proving service is unavailable. Your local data remains on this device; try again shortly.'
  if (message.includes('broadcast channel') || message.includes('channel secret') || message.includes('orphaned data')) return 'A browser wallet extension could not start its secure channel. Unlock 1AM, reload the page, and temporarily disable conflicting wallet extensions.'
  if (message.includes('indexer') || message.includes('failed to fetch') || message.includes('service unavailable')) return 'The Midnight network indexer is unavailable. No receipt was created; try again shortly.'
  if (message.includes('network mismatch') || message.includes('wrong network') || message.includes('unsupported network') || message.includes('invalid network id')) return 'The wallet network does not match this ballot. Select the same Preview or Preprod network in 1AM and try again.'
  if (message.includes('disconnect') || message.includes('wallet is unavailable')) return 'The 1AM session ended before connecting. Unlock 1AM, keep its approval window open, and try again.'
  return originalMessage || 'The wallet request failed. No transaction was created.'
}
