export type Network = 'preview' | 'preprod'
export type MidnightProvider = { name?: string; connect?: (options?: { network: Network }) => Promise<{ address?: string }>; disconnect?: () => Promise<void>; submitBallotProof?: (payload: { ballotId: string; network: Network }) => Promise<{ txId: string }> }

declare global { interface Window { midnight?: Record<string, MidnightProvider> } }

export function discoverWallets(): Array<{ id: string; provider: MidnightProvider }> {
  return Object.entries(window.midnight ?? {}).map(([id, provider]) => ({ id, provider })).sort((a, b) => Number((b.provider.name ?? '').toLowerCase().includes('1am')) - Number((a.provider.name ?? '').toLowerCase().includes('1am')))
}

export async function connectWallet(network: Network) {
  const wallet = discoverWallets()[0]
  if (!wallet?.provider.connect) throw new Error('No Midnight wallet was found. Install or unlock 1AM, then try again.')
  const session = await wallet.provider.connect({ network })
  return { ...wallet, address: session.address }
}

export async function submitProof(provider: MidnightProvider, ballotId: string, network: Network) {
  if (!provider.submitBallotProof) throw new Error('This wallet cannot submit the Ballot Boreal Compact circuit yet. No transaction was created.')
  return provider.submitBallotProof({ ballotId, network })
}

export function describeWalletError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('reject') || message.includes('denied')) return 'You declined the wallet request. Nothing was submitted.'
  if (message.includes('dust') || message.includes('balance')) return 'Your wallet needs sufficient DUST before it can submit this proof.'
  if (message.includes('prover') || message.includes('proof service')) return 'The proving service is unavailable. Your local data remains on this device; try again shortly.'
  if (message.includes('indexer') || message.includes('network')) return 'The Midnight network indexer is unavailable. No receipt was created; try again shortly.'
  return error instanceof Error ? error.message : 'The wallet request failed. No transaction was created.'
}
