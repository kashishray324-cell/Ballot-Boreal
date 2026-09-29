import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js'
import type { WitnessContext } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime'
import type { MidnightProviders, UnboundTransaction } from '@midnight-ntwrk/midnight-js-types'
import * as Ballot from '../../contracts/artifacts/contract/index.js'
import type { LocalWitnessRecord } from './vault'

export type BallotPrivateState = { membership: Ballot.MembershipWitness }
export const ballotPrivateStateKey = 'ballotBorealMembership' as const

export const ballotWitnesses = {
  membershipWitness: ({ privateState }: WitnessContext<Ballot.Ledger, BallotPrivateState>): [BallotPrivateState, Ballot.MembershipWitness] => [
    privateState,
    privateState.membership,
  ],
}

export const compiledBallotContract = CompiledContract.make<Ballot.Contract<BallotPrivateState>>(
  'BallotBoreal',
  Ballot.Contract<BallotPrivateState>,
).pipe(
  CompiledContract.withWitnesses(ballotWitnesses),
  CompiledContract.withCompiledFileAssets('.'),
)

export type BallotContract = Ballot.Contract<BallotPrivateState, Ballot.Witnesses<BallotPrivateState>>
export type BallotCircuit = Exclude<keyof BallotContract['impureCircuits'], number | symbol>
export type BallotProviders = MidnightProviders<BallotCircuit, typeof ballotPrivateStateKey, BallotPrivateState>
export type BallotUnboundTransaction = UnboundTransaction

export function decodeWitness(record: LocalWitnessRecord): BallotPrivateState {
  return {
    membership: {
      secret: Uint8Array.from(record.secret),
      siblings: record.siblings.map((value) => Uint8Array.from(value)),
      siblingOnLeft: record.siblingOnLeft,
    },
  }
}

export function membershipRoot(state: BallotPrivateState): Uint8Array {
  return Ballot.pureCircuits.memberRoot(state.membership)
}
