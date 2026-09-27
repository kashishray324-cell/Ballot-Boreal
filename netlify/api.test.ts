import { describe, expect, it } from 'vitest'
import handler from './functions/api.mts'

const context = {} as Parameters<typeof handler>[1]

describe('Netlify public API adapter', () => {
  it('routes unknown API paths without exposing internals', async () => {
    const response = await handler(new Request('https://example.netlify.app/api/unknown'), context)
    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'Not found.' })
  })

  it('answers CORS preflight only for an allowed origin', async () => {
    const previous = process.env.ALLOWED_ORIGINS
    process.env.ALLOWED_ORIGINS = 'https://ballot.example'
    try {
      const response = await handler(new Request('https://example.netlify.app/api/metrics', {
        method: 'OPTIONS',
        headers: { Origin: 'https://ballot.example' },
      }), context)
      expect(response.status).toBe(204)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://ballot.example')
    } finally {
      if (previous === undefined) delete process.env.ALLOWED_ORIGINS
      else process.env.ALLOWED_ORIGINS = previous
    }
  })

  it('routes metrics to the API function rather than the SPA', async () => {
    const previous = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    try {
      const response = await handler(new Request('https://example.netlify.app/api/metrics'), context)
      expect(response.status).toBe(503)
      await expect(response.json()).resolves.toEqual({ error: 'Public metrics are temporarily unavailable.' })
    } finally {
      if (previous !== undefined) process.env.DATABASE_URL = previous
    }
  })

  it('keeps the policy guide available without a database', async () => {
    const previous = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    try {
      const response = await handler(new Request('https://example.netlify.app/api/policy-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_requirement: 'Active members may submit one proof.' }),
      }), context)
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({ source: 'local-fallback' })
    } finally {
      if (previous !== undefined) process.env.DATABASE_URL = previous
    }
  })
})
