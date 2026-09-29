import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider'
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider'
import { deployContract, findDeployedContract, type FoundContract } from '@midnight-ntwrk/midnight-js-contracts'
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime'
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime'
import {
  Binding,
  type FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  type TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger'
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api'
import { createProofProvider } from '@midnight-ntwrk/midnight-js-types'
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id'
import {
  ballotPrivateStateKey,
  compiledBallotContract,
  decodeWitness,
  membershipRoot,
  type BallotCircuit,
  type BallotContract,
  type BallotPrivateState,
  type BallotProviders,
  type BallotUnboundTransaction,
} from './ballot-contract'
import { inMemoryPrivateStateProvider } from './private-state-provider'
import type { LocalWitnessRecord } from './vault'
import type { Network } from './wallet'

const ADDRESS_PREFIX = 'ballot-boreal:contract-address'

function bytes32(text: string): Uint8Array {
  const encoded = new TextEncoder().encode(text)
  if (encoded.length > 32) throw new Error('Ballot ID must be at most 32 UTF-8 bytes.')
  const result = new Uint8Array(32)
  result.set(encoded)
  return result
}

function configuredAddress(network: Network): string | undefined {
  const specific = network === 'preview'
    ? import.meta.env.VITE_BALLOT_CONTRACT_ADDRESS_PREVIEW
    : import.meta.env.VITE_BALLOT_CONTRACT_ADDRESS_PREPROD
  return specific?.trim() || import.meta.env.VITE_BALLOT_CONTRACT_ADDRESS?.trim() || undefined
}

function addressKey(network: Network, ballotId: string) {
  return `${ADDRESS_PREFIX}:${network}:${ballotId}`
}

function resolveAddress(network: Network, ballotId: string): string | undefined {
  return configuredAddress(network) || localStorage.getItem(addressKey(network, ballotId)) || undefined
}

async function providersFor(connected: ConnectedAPI): Promise<BallotProviders> {
  const configuration = await connected.getConfiguration()
  const zkConfigProvider = new FetchZkConfigProvider<BallotCircuit>(window.location.origin, window.fetch.bind(window))
  const provingProvider = await connected.getProvingProvider(zkConfigProvider)
  const addresses = await connected.getShieldedAddresses()
  const privateStateProvider = inMemoryPrivateStateProvider<typeof ballotPrivateStateKey, BallotPrivateState>()

  return {
    privateStateProvider,
    zkConfigProvider,
    proofProvider: createProofProvider(provingProvider),
    publicDataProvider: indexerPublicDataProvider(configuration.indexerUri, configuration.indexerWsUri),
    walletProvider: {
      getCoinPublicKey: () => addresses.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => addresses.shieldedEncryptionPublicKey,
      balanceTx: async (tx: BallotUnboundTransaction): Promise<FinalizedTransaction> => {
        const balanced = await connected.balanceUnsealedTransaction(toHex(tx.serialize()))
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature',
          'proof',
          'binding',
          fromHex(balanced.tx),
        )
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connected.submitTransaction(toHex(tx.serialize()))
        const [transactionId] = tx.identifiers()
        if (!transactionId) throw new Error('The finalized transaction did not contain an identifier.')
        return transactionId
      },
    },
  }
}

async function resolveBallotContract(
  providers: BallotProviders,
  state: BallotPrivateState,
  network: Network,
  ballotId: string,
): Promise<{ contract: FoundContract<BallotContract>; deployed: boolean; address: string }> {
  const existingAddress = resolveAddress(network, ballotId)
  if (existingAddress) {
    const contract = await findDeployedContract<BallotContract>(providers, {
      contractAddress: existingAddress as ContractAddress,
      compiledContract: compiledBallotContract,
      privateStateId: ballotPrivateStateKey,
      initialPrivateState: state,
    })
    providers.privateStateProvider.setContractAddress(existingAddress as ContractAddress)
    return { contract, deployed: false, address: existingAddress }
  }

  const deployed = await deployContract(providers, {
    compiledContract: compiledBallotContract,
    privateStateId: ballotPrivateStateKey,
    initialPrivateState: state,
    args: [bytes32(ballotId), membershipRoot(state)],
  })
  const address = deployed.deployTxData.public.contractAddress
  providers.privateStateProvider.setContractAddress(address)
  localStorage.setItem(addressKey(network, ballotId), address)
  return { contract: deployed, deployed: true, address }
}

export async function submitBallotProof(
  connected: ConnectedAPI,
  witness: LocalWitnessRecord,
  ballotId: string,
  network: Network,
) {
  // Keep the global Midnight.js runtime aligned with the ballot's selected network,
  // including if the voter changed networks after connecting their wallet.
  setNetworkId(network)

  await connected.hintUsage([
    'getConfiguration',
    'getShieldedAddresses',
    'getProvingProvider',
    'balanceUnsealedTransaction',
    'submitTransaction',
  ])
  const providers = await providersFor(connected)
  const state = decodeWitness(witness)
  const { contract, deployed, address } = await resolveBallotContract(providers, state, network, ballotId)
  const result = await contract.callTx.castOnce(bytes32(ballotId))
  return {
    txId: result.public.txId,
    txHash: result.public.txHash,
    blockHeight: result.public.blockHeight,
    nullifier: toHex(result.private.result),
    contractAddress: address,
    deployed,
  }
}
