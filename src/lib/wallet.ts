import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api'
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id'
import { submitBallotProof } from './midnight'
import type { LocalWitnessRecord } from './vault'

export type Network = 'preview' | 'preprod'
export type MidnightProvider = ConnectedAPI & { disconnect?: () => Promise<void> }

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
  // Midnight.js uses a global network ID for address derivation and transaction serialization.
  // Set it before invoking the wallet connector or any other Midnight operation.
  setNetworkId(network)

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

export async function submitProof(provider: MidnightProvider, witness: LocalWitnessRecord | null, ballotId: string, network: Network) {
  if (!witness) throw new Error('Prepare a local membership proof before generating the circuit.')
  return submitBallotProof(provider, witness, ballotId, network)
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
  if (message.includes('failed to fetch zk artifact') || message.includes('expected zk artifact')) return 'The compiled Ballot Boreal proving files could not be loaded. Redeploy the complete frontend build, including /keys and /zkir.'
  if (message.includes('membership witness is not eligible')) return 'This local membership proof does not belong to the configured ballot root. Import the authority-issued proof for this ballot.'
  if (message.includes('already accepted for this ballot')) return 'This private membership proof has already been accepted for this ballot. The contract prevented a duplicate.'
  if (message.includes('broadcast channel') || message.includes('channel secret') || message.includes('orphaned data')) return 'A browser wallet extension could not start its secure channel. Unlock 1AM, reload the page, and temporarily disable conflicting wallet extensions.'
  if (message.includes('indexer') || message.includes('failed to fetch') || message.includes('service unavailable')) return 'The Midnight network indexer is unavailable. No receipt was created; try again shortly.'
  if (message.includes('network mismatch') || message.includes('wrong network') || message.includes('unsupported network') || message.includes('invalid network id')) return 'The wallet network does not match this ballot. Select the same Preview or Preprod network in 1AM and try again.'
  if (message.includes('disconnect') || message.includes('wallet is unavailable')) return 'The 1AM session ended before connecting. Unlock 1AM, keep its approval window open, and try again.'
  return originalMessage || 'The wallet request failed. No transaction was created.'
}
