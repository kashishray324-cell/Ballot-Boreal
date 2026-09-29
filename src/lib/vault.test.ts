import { beforeEach, describe, expect, it } from 'vitest'
import { clearLocalWitness, importLocalWitness, loadLocalWitness, replaceLocalWitness } from './vault'

describe('local private state', () => {
  beforeEach(clearLocalWitness)
  it('persists a complete private Merkle witness locally', () => {
    replaceLocalWitness('Local record')
    expect(loadLocalWitness()).toMatchObject({ label: 'Local record', secret: expect.any(Array) })
    expect(loadLocalWitness()?.secret).toHaveLength(32)
    expect(loadLocalWitness()?.siblings).toHaveLength(8)
  })
  it('rotates a replacement record', () => { replaceLocalWitness('First'); expect(replaceLocalWitness('Second').version).toBe(2) })
  it('imports an authority-issued witness without uploading it', () => {
    const issued = replaceLocalWitness('Authority issued')
    clearLocalWitness()
    expect(importLocalWitness(JSON.stringify(issued)).label).toBe('Authority issued')
  })
})
