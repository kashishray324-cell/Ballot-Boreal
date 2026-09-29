import type { ContractAddress, SigningKey } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime'
import type { PrivateStateId, PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types'

/**
 * Session-scoped provider used by Midnight.js. The encrypted witness remains in
 * localStorage; only its decoded in-memory copy is exposed during a circuit call.
 */
export function inMemoryPrivateStateProvider<PSI extends PrivateStateId, PS>(): PrivateStateProvider<PSI, PS> {
  const states = new Map<ContractAddress, Map<PSI, PS>>()
  const signingKeys = new Map<ContractAddress, SigningKey>()
  let activeAddress: ContractAddress | null = null

  const requireAddress = () => {
    if (!activeAddress) throw new Error('Contract address is not set for private state.')
    return activeAddress
  }

  const scoped = (address: ContractAddress) => {
    let values = states.get(address)
    if (!values) {
      values = new Map<PSI, PS>()
      states.set(address, values)
    }
    return values
  }

  return {
    setContractAddress(address) { activeAddress = address },
    async set(key, value) { scoped(requireAddress()).set(key, value) },
    async get(key) { return scoped(requireAddress()).get(key) ?? null },
    async remove(key) { scoped(requireAddress()).delete(key) },
    async clear() { states.delete(requireAddress()) },
    async setSigningKey(address, signingKey) { signingKeys.set(address, signingKey) },
    async getSigningKey(address) { return signingKeys.get(address) ?? null },
    async removeSigningKey(address) { signingKeys.delete(address) },
    async clearSigningKeys() { signingKeys.clear() },
    async exportPrivateStates() { throw new Error('Private-state export is not available in this browser session.') },
    async importPrivateStates() { throw new Error('Private-state import is not available in this browser session.') },
    async exportSigningKeys() { throw new Error('Signing-key export is not available in this browser session.') },
    async importSigningKeys() { throw new Error('Signing-key import is not available in this browser session.') },
  }
}
