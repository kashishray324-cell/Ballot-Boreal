import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type MembershipWitness = { secret: Uint8Array;
                                  siblings: Uint8Array[];
                                  siblingOnLeft: boolean[]
                                };

export type Witnesses<PS> = {
  membershipWitness(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, MembershipWitness];
}

export type ImpureCircuits<PS> = {
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   requestedBallotId_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  castOnce(context: __compactRuntime.CircuitContext<PS>,
           requestedBallotId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type ProvableCircuits<PS> = {
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   requestedBallotId_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  castOnce(context: __compactRuntime.CircuitContext<PS>,
           requestedBallotId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type PureCircuits = {
  memberLeaf(secret_0: Uint8Array): Uint8Array;
  merkleParent(node_0: Uint8Array,
               sibling_0: Uint8Array,
               siblingOnLeft_0: boolean): Uint8Array;
  memberRoot(witnessData_0: MembershipWitness): Uint8Array;
}

export type Circuits<PS> = {
  memberLeaf(context: __compactRuntime.CircuitContext<PS>, secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  merkleParent(context: __compactRuntime.CircuitContext<PS>,
               node_0: Uint8Array,
               sibling_0: Uint8Array,
               siblingOnLeft_0: boolean): __compactRuntime.CircuitResults<PS, Uint8Array>;
  memberRoot(context: __compactRuntime.CircuitContext<PS>,
             witnessData_0: MembershipWitness): __compactRuntime.CircuitResults<PS, Uint8Array>;
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   requestedBallotId_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  castOnce(context: __compactRuntime.CircuitContext<PS>,
           requestedBallotId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly ballotId: Uint8Array;
  readonly membershipRoot: Uint8Array;
  readonly finalizedProofs: bigint;
  usedNullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               configuredBallotId_0: Uint8Array,
               configuredMembershipRoot_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
