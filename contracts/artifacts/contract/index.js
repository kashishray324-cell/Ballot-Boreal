import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

const _descriptor_0 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_1 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_2 = __compactRuntime.CompactTypeBoolean;

const _descriptor_3 = new __compactRuntime.CompactTypeVector(8, _descriptor_1);

const _descriptor_4 = new __compactRuntime.CompactTypeVector(8, _descriptor_2);

class _MembershipWitness_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment()));
  }
  fromValue(value_0) {
    return {
      secret: _descriptor_1.fromValue(value_0),
      siblings: _descriptor_3.fromValue(value_0),
      siblingOnLeft: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.secret).concat(_descriptor_3.toValue(value_0.siblings).concat(_descriptor_4.toValue(value_0.siblingOnLeft)));
  }
}

const _descriptor_5 = new _MembershipWitness_0();

class _tuple_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_1.fromValue(value_0),
      _descriptor_1.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0[0]).concat(_descriptor_1.toValue(value_0[1]));
  }
}

const _descriptor_6 = new _tuple_0();

const _descriptor_7 = new __compactRuntime.CompactTypeBytes(24);

class _tuple_1 {
  alignment() {
    return _descriptor_7.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return [
      _descriptor_7.fromValue(value_0),
      _descriptor_1.fromValue(value_0),
      _descriptor_1.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_7.toValue(value_0[0]).concat(_descriptor_1.toValue(value_0[1]).concat(_descriptor_1.toValue(value_0[2])));
  }
}

const _descriptor_8 = new _tuple_1();

const _descriptor_9 = new __compactRuntime.CompactTypeBytes(21);

class _tuple_2 {
  alignment() {
    return _descriptor_9.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_9.fromValue(value_0),
      _descriptor_1.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_9.toValue(value_0[0]).concat(_descriptor_1.toValue(value_0[1]));
  }
}

const _descriptor_10 = new _tuple_2();

const _descriptor_11 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

class _Either_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_2.fromValue(value_0),
      left: _descriptor_1.fromValue(value_0),
      right: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.is_left).concat(_descriptor_1.toValue(value_0.left).concat(_descriptor_1.toValue(value_0.right)));
  }
}

const _descriptor_12 = new _Either_0();

const _descriptor_13 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_14 = new _ContractAddress_0();

const _descriptor_15 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.membershipWitness) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named membershipWitness');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      memberLeaf(context, ...args_1) {
        return { result: pureCircuits.memberLeaf(...args_1), context };
      },
      merkleParent(context, ...args_1) {
        return { result: pureCircuits.merkleParent(...args_1), context };
      },
      memberRoot(context, ...args_1) {
        return { result: pureCircuits.memberRoot(...args_1), context };
      },
      proveEligibility: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`proveEligibility: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const requestedBallotId_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('proveEligibility',
                                     'argument 1 (as invoked from Typescript)',
                                     'BallotBoreal.compact line 76 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(requestedBallotId_0.buffer instanceof ArrayBuffer && requestedBallotId_0.BYTES_PER_ELEMENT === 1 && requestedBallotId_0.length === 32)) {
          __compactRuntime.typeError('proveEligibility',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'BallotBoreal.compact line 76 char 1',
                                     'Bytes<32>',
                                     requestedBallotId_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(requestedBallotId_0),
            alignment: _descriptor_1.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._proveEligibility_0(context,
                                                  partialProofData,
                                                  requestedBallotId_0);
        partialProofData.output = { value: _descriptor_2.toValue(result_0), alignment: _descriptor_2.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      castOnce: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`castOnce: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const requestedBallotId_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('castOnce',
                                     'argument 1 (as invoked from Typescript)',
                                     'BallotBoreal.compact line 87 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(requestedBallotId_0.buffer instanceof ArrayBuffer && requestedBallotId_0.BYTES_PER_ELEMENT === 1 && requestedBallotId_0.length === 32)) {
          __compactRuntime.typeError('castOnce',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'BallotBoreal.compact line 87 char 1',
                                     'Bytes<32>',
                                     requestedBallotId_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(requestedBallotId_0),
            alignment: _descriptor_1.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._castOnce_0(context,
                                          partialProofData,
                                          requestedBallotId_0);
        partialProofData.output = { value: _descriptor_1.toValue(result_0), alignment: _descriptor_1.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      proveEligibility: this.circuits.proveEligibility,
      castOnce: this.circuits.castOnce
    };
    this.provableCircuits = {
      proveEligibility: this.circuits.proveEligibility,
      castOnce: this.circuits.castOnce
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 3) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 3 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const configuredBallotId_0 = args_0[1];
    const configuredMembershipRoot_0 = args_0[2];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!(configuredBallotId_0.buffer instanceof ArrayBuffer && configuredBallotId_0.BYTES_PER_ELEMENT === 1 && configuredBallotId_0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 1 (argument 2 as invoked from Typescript)',
                                 'BallotBoreal.compact line 25 char 1',
                                 'Bytes<32>',
                                 configuredBallotId_0)
    }
    if (!(configuredMembershipRoot_0.buffer instanceof ArrayBuffer && configuredMembershipRoot_0.BYTES_PER_ELEMENT === 1 && configuredMembershipRoot_0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 2 (argument 3 as invoked from Typescript)',
                                 'BallotBoreal.compact line 25 char 1',
                                 'Bytes<32>',
                                 configuredMembershipRoot_0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('proveEligibility', new __compactRuntime.ContractOperation());
    state_0.setOperation('castOnce', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(1n),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(2n),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(0n),
                                                                                              alignment: _descriptor_11.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(3n),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(0n),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(configuredBallotId_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(1n),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(configuredMembershipRoot_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_10, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_6, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_8, value_0);
    return result_0;
  }
  _membershipWitness_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.membershipWitness(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.secret.buffer instanceof ArrayBuffer && result_0.secret.BYTES_PER_ELEMENT === 1 && result_0.secret.length === 32 && Array.isArray(result_0.siblings) && result_0.siblings.length === 8 && result_0.siblings.every((t) => t.buffer instanceof ArrayBuffer && t.BYTES_PER_ELEMENT === 1 && t.length === 32) && Array.isArray(result_0.siblingOnLeft) && result_0.siblingOnLeft.length === 8 && result_0.siblingOnLeft.every((t) => typeof(t) === 'boolean'))) {
      __compactRuntime.typeError('membershipWitness',
                                 'return value',
                                 'BallotBoreal.compact line 23 char 1',
                                 'struct MembershipWitness<secret: Bytes<32>, siblings: Vector<8, Bytes<32>>, siblingOnLeft: Vector<8, Boolean>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_5.toValue(result_0),
      alignment: _descriptor_5.alignment()
    });
    return result_0;
  }
  _memberLeaf_0(secret_0) {
    return this._persistentHash_0([new Uint8Array([98, 97, 108, 108, 111, 116, 45, 98, 111, 114, 101, 97, 108, 58, 109, 101, 109, 98, 101, 114, 58]),
                                   secret_0]);
  }
  _merkleParent_0(node_0, sibling_0, siblingOnLeft_0) {
    if (siblingOnLeft_0) {
      return this._persistentHash_1([sibling_0, node_0]);
    } else {
      return this._persistentHash_1([node_0, sibling_0]);
    }
  }
  _memberRoot_0(witnessData_0) {
    const level0_0 = this._memberLeaf_0(witnessData_0.secret);
    const level1_0 = this._merkleParent_0(level0_0,
                                          witnessData_0.siblings[0],
                                          witnessData_0.siblingOnLeft[0]);
    const level2_0 = this._merkleParent_0(level1_0,
                                          witnessData_0.siblings[1],
                                          witnessData_0.siblingOnLeft[1]);
    const level3_0 = this._merkleParent_0(level2_0,
                                          witnessData_0.siblings[2],
                                          witnessData_0.siblingOnLeft[2]);
    const level4_0 = this._merkleParent_0(level3_0,
                                          witnessData_0.siblings[3],
                                          witnessData_0.siblingOnLeft[3]);
    const level5_0 = this._merkleParent_0(level4_0,
                                          witnessData_0.siblings[4],
                                          witnessData_0.siblingOnLeft[4]);
    const level6_0 = this._merkleParent_0(level5_0,
                                          witnessData_0.siblings[5],
                                          witnessData_0.siblingOnLeft[5]);
    const level7_0 = this._merkleParent_0(level6_0,
                                          witnessData_0.siblings[6],
                                          witnessData_0.siblingOnLeft[6]);
    return this._merkleParent_0(level7_0,
                                witnessData_0.siblings[7],
                                witnessData_0.siblingOnLeft[7]);
  }
  _requireEligible_0(context, partialProofData, requestedBallotId_0) {
    const publicBallotId_0 = requestedBallotId_0;
    __compactRuntime.assert(this._equal_0(publicBallotId_0,
                                          _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_15.toValue(0n),
                                                                                                                                alignment: _descriptor_15.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value)),
                            'Wrong ballot');
    const witnessData_0 = this._membershipWitness_0(context, partialProofData);
    __compactRuntime.assert(this._equal_1(this._memberRoot_0(witnessData_0),
                                          _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_15.toValue(1n),
                                                                                                                                alignment: _descriptor_15.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value)),
                            'Membership witness is not eligible');
    return witnessData_0.secret;
  }
  _proveEligibility_0(context, partialProofData, requestedBallotId_0) {
    this._requireEligible_0(context, partialProofData, requestedBallotId_0);
    return true;
  }
  _castOnce_0(context, partialProofData, requestedBallotId_0) {
    const secret_0 = this._requireEligible_0(context,
                                             partialProofData,
                                             requestedBallotId_0);
    const nullifier_0 = this._persistentHash_2([new Uint8Array([98, 97, 108, 108, 111, 116, 45, 98, 111, 114, 101, 97, 108, 58, 110, 117, 108, 108, 105, 102, 105, 101, 114, 58]),
                                                _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                          partialProofData,
                                                                                                          [
                                                                                                           { dup: { n: 0 } },
                                                                                                           { idx: { cached: false,
                                                                                                                    pushPath: false,
                                                                                                                    path: [
                                                                                                                           { tag: 'value',
                                                                                                                             value: { value: _descriptor_15.toValue(0n),
                                                                                                                                      alignment: _descriptor_15.alignment() } }] } },
                                                                                                           { popeq: { cached: false,
                                                                                                                      result: undefined } }]).value),
                                                secret_0]);
    const publicNullifier_0 = nullifier_0;
    __compactRuntime.assert(!_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_15.toValue(3n),
                                                                                                                   alignment: _descriptor_15.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(publicNullifier_0),
                                                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'A proof was already accepted for this ballot');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_15.toValue(3n),
                                                                  alignment: _descriptor_15.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(publicNullifier_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_0 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_15.toValue(2n),
                                                                  alignment: _descriptor_15.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(tmp_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return publicNullifier_0;
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get ballotId() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_15.toValue(0n),
                                                                                                   alignment: _descriptor_15.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get membershipRoot() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_15.toValue(1n),
                                                                                                   alignment: _descriptor_15.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get finalizedProofs() {
      return _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_15.toValue(2n),
                                                                                                    alignment: _descriptor_15.alignment() } }] } },
                                                                         { popeq: { cached: true,
                                                                                    result: undefined } }]).value);
    },
    usedNullifiers: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_15.toValue(3n),
                                                                                                     alignment: _descriptor_15.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(0n),
                                                                                                                                 alignment: _descriptor_11.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_15.toValue(3n),
                                                                                                      alignment: _descriptor_15.alignment() } }] } },
                                                                           'size',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'BallotBoreal.compact line 21 char 1',
                                     'Bytes<32>',
                                     elem_0)
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_15.toValue(3n),
                                                                                                     alignment: _descriptor_15.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[3];
        return self_0.asMap().keys().map((elem) => _descriptor_1.fromValue(elem.value))[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  membershipWitness: (...args) => undefined
});
export const pureCircuits = {
  memberLeaf: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`memberLeaf: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const secret_0 = args_0[0];
    if (!(secret_0.buffer instanceof ArrayBuffer && secret_0.BYTES_PER_ELEMENT === 1 && secret_0.length === 32)) {
      __compactRuntime.typeError('memberLeaf',
                                 'argument 1',
                                 'BallotBoreal.compact line 34 char 1',
                                 'Bytes<32>',
                                 secret_0)
    }
    return _dummyContract._memberLeaf_0(secret_0);
  },
  merkleParent: (...args_0) => {
    if (args_0.length !== 3) {
      throw new __compactRuntime.CompactError(`merkleParent: expected 3 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const node_0 = args_0[0];
    const sibling_0 = args_0[1];
    const siblingOnLeft_0 = args_0[2];
    if (!(node_0.buffer instanceof ArrayBuffer && node_0.BYTES_PER_ELEMENT === 1 && node_0.length === 32)) {
      __compactRuntime.typeError('merkleParent',
                                 'argument 1',
                                 'BallotBoreal.compact line 41 char 1',
                                 'Bytes<32>',
                                 node_0)
    }
    if (!(sibling_0.buffer instanceof ArrayBuffer && sibling_0.BYTES_PER_ELEMENT === 1 && sibling_0.length === 32)) {
      __compactRuntime.typeError('merkleParent',
                                 'argument 2',
                                 'BallotBoreal.compact line 41 char 1',
                                 'Bytes<32>',
                                 sibling_0)
    }
    if (!(typeof(siblingOnLeft_0) === 'boolean')) {
      __compactRuntime.typeError('merkleParent',
                                 'argument 3',
                                 'BallotBoreal.compact line 41 char 1',
                                 'Boolean',
                                 siblingOnLeft_0)
    }
    return _dummyContract._merkleParent_0(node_0, sibling_0, siblingOnLeft_0);
  },
  memberRoot: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`memberRoot: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const witnessData_0 = args_0[0];
    if (!(typeof(witnessData_0) === 'object' && witnessData_0.secret.buffer instanceof ArrayBuffer && witnessData_0.secret.BYTES_PER_ELEMENT === 1 && witnessData_0.secret.length === 32 && Array.isArray(witnessData_0.siblings) && witnessData_0.siblings.length === 8 && witnessData_0.siblings.every((t) => t.buffer instanceof ArrayBuffer && t.BYTES_PER_ELEMENT === 1 && t.length === 32) && Array.isArray(witnessData_0.siblingOnLeft) && witnessData_0.siblingOnLeft.length === 8 && witnessData_0.siblingOnLeft.every((t) => typeof(t) === 'boolean'))) {
      __compactRuntime.typeError('memberRoot',
                                 'argument 1',
                                 'BallotBoreal.compact line 51 char 1',
                                 'struct MembershipWitness<secret: Bytes<32>, siblings: Vector<8, Bytes<32>>, siblingOnLeft: Vector<8, Boolean>>',
                                 witnessData_0)
    }
    return _dummyContract._memberRoot_0(witnessData_0);
  }
};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
