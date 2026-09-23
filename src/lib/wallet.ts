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
