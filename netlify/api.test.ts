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
})
