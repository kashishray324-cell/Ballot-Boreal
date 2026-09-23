import { beforeEach, describe, expect, it } from 'vitest'
import { clearLocalWitness, loadLocalWitness, replaceLocalWitness } from './vault'

describe('local private state', () => {
  beforeEach(clearLocalWitness)
  it('persists only local witness metadata', () => { replaceLocalWitness('Local record'); expect(loadLocalWitness()?.label).toBe('Local record') })
  it('rotates a replacement record', () => { replaceLocalWitness('First'); expect(replaceLocalWitness('Second').version).toBe(2) })
})
