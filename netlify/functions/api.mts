import type { Config, Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { createHash } from 'node:crypto'

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }
type PolicyPlan = {
  summary: string
  disclosures: string[]
  private_by_default: string[]
  caution: string
  source: 'gemini' | 'local-fallback'
}

const PRIVATE_KEYS = ['witness', 'secret', 'credential', 'identity', 'vote', 'choice', 'seed', 'document', 'address']
const PRIVATE_VALUE_TERMS = ['seed', 'secret', 'credential', 'witness', 'vote']
const BASE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

function json(body: JsonValue, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, ...extraHeaders } })
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin')
  const allowed = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean)
  if (!origin || !allowed.includes(origin)) return {}
  return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
}

function routeFor(request: Request) {
  return new URL(request.url).pathname
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '') || '/'
}

function database() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not configured')
  return neon(url)
}

function fallbackPlan(requirement: string): PolicyPlan {
  return {
    summary: `This ballot requires: ${requirement.slice(0, 220)}`,
    disclosures: ['Eligibility is valid', 'One-time nullifier'],
    private_by_default: ['Credential contents', 'Identity', 'Vote selection', 'Wallet-held proving material'],
    caution: 'Only public policy text was reviewed. Verify the issuer and deadline before proving.',
    source: 'local-fallback',
  }
}

function redactSensitiveText(value: string) {
  return value
    .replace(/(?:seed phrase|mnemonic|private key)\s*[:=]?\s*[^\n,;]+/gi, '[redacted]')
    .replace(/\b0x[a-fA-F0-9]{40}\b/g, '[redacted]')
    .replace(/\b\d{8,}\b/g, '[redacted]')
}

function isPolicyPlan(value: unknown): value is Omit<PolicyPlan, 'source'> {
  if (!value || typeof value !== 'object') return false
  const plan = value as Record<string, unknown>
  return typeof plan.summary === 'string'
    && Array.isArray(plan.disclosures) && plan.disclosures.every((item) => typeof item === 'string')
    && Array.isArray(plan.private_by_default) && plan.private_by_default.every((item) => typeof item === 'string')
    && typeof plan.caution === 'string'
}

async function geminiPlan(requirement: string): Promise<PolicyPlan> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fallbackPlan(requirement)

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7_000)
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Explain this PUBLIC voting policy. Never request or infer credentials, secrets, wallet addresses, identity, or vote choices. Policy: ${requirement}` }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            required: ['summary', 'disclosures', 'private_by_default', 'caution'],
            properties: {
              summary: { type: 'string' },
              disclosures: { type: 'array', items: { type: 'string' } },
              private_by_default: { type: 'array', items: { type: 'string' } },
              caution: { type: 'string' },
            },
          },
        },
      }),
    })
    if (!response.ok) return fallbackPlan(requirement)
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return fallbackPlan(requirement)
    const parsed: unknown = JSON.parse(text)
    return isPolicyPlan(parsed) ? { ...parsed, source: 'gemini' } : fallbackPlan(requirement)
  } catch {
    return fallbackPlan(requirement)
  } finally {
    clearTimeout(timeout)
  }
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json()
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
  } catch {
    return null
  }
}

async function health() {
  try {
    const sql = database()
    await sql`SELECT 1`
    return json({ status: 'ok', database: true, environment: process.env.ENVIRONMENT ?? 'production' }, 200, { 'Cache-Control': 'no-store' })
  } catch {
    return json({ status: 'degraded', database: false, environment: process.env.ENVIRONMENT ?? 'production' }, 503, { 'Cache-Control': 'no-store' })
  }
}

async function metrics() {
  try {
    const sql = database()
    const rows = await sql`SELECT COUNT(*)::int AS count FROM proof_receipts`
    return json({ finalized_proofs: Number(rows[0]?.count ?? 0), public_only: true }, 200, { 'Cache-Control': 'public, max-age=60' })
  } catch {
    return json({ error: 'Public metrics are temporarily unavailable.' }, 503, { 'Cache-Control': 'no-store' })
  }
}

async function policyPlan(request: Request) {
  const payload = await readJson(request)
  if (!payload || Object.keys(payload).some((key) => key !== 'public_requirement')) return json({ error: 'Only public_requirement is accepted.' }, 422)
  const raw = payload.public_requirement
  if (typeof raw !== 'string' || raw.trim().length < 8 || raw.length > 1500) return json({ error: 'public_requirement must contain 8 to 1500 characters.' }, 422)

  const clean = redactSensitiveText(raw.trim())
  const key = createHash('sha256').update(clean).digest('hex')
  const sql = process.env.DATABASE_URL ? database() : null
  if (sql) {
    try {
      const existing = await sql`SELECT plan_json FROM policy_plans WHERE request_hash = ${key} LIMIT 1`
      if (existing[0]?.plan_json) {
        const saved = typeof existing[0].plan_json === 'string' ? JSON.parse(existing[0].plan_json) : existing[0].plan_json
        return json(saved as JsonValue, 200, { 'Cache-Control': 'public, max-age=60' })
      }
    } catch {
      // Policy explanation remains useful when the optional cache is unavailable.
    }
  }

  const plan = await geminiPlan(clean)
  if (sql) {
    try {
      await sql`INSERT INTO policy_plans (request_hash, plan_json, created_at) VALUES (${key}, ${JSON.stringify(plan)}, NOW()) ON CONFLICT (request_hash) DO NOTHING`
    } catch {
      // A cache write must never block the privacy explanation itself.
    }
  }
  return json(plan, 200, { 'Cache-Control': 'public, max-age=60' })
}

async function createReceipt(request: Request) {
  const payload = await readJson(request)
  const allowedKeys = ['tx_id', 'ballot_id', 'network', 'nullifier', 'outcome']
  if (!payload || Object.keys(payload).some((key) => !allowedKeys.includes(key) || PRIVATE_KEYS.some((term) => key.toLowerCase().includes(term)))) {
    return json({ error: 'Private or unknown fields are prohibited in public receipts.' }, 422)
  }
  const { tx_id: txId, ballot_id: ballotId, network, nullifier, outcome } = payload
  const validText = (value: unknown, min: number, max: number) => typeof value === 'string' && value.length >= min && value.length <= max
  const containsPrivateTerm = (value: unknown) => typeof value === 'string' && PRIVATE_VALUE_TERMS.some((term) => value.toLowerCase().includes(term))
  if (!validText(txId, 8, 128) || !validText(ballotId, 3, 128) || !validText(nullifier, 16, 128)
    || containsPrivateTerm(txId) || containsPrivateTerm(ballotId) || containsPrivateTerm(nullifier)
    || (network !== 'preview' && network !== 'preprod') || outcome !== 'accepted') {
    return json({ error: 'Receipt fields are invalid or contain prohibited private material.' }, 422)
  }

  const safeTxId = txId as string
  const safeBallotId = ballotId as string
  const safeNullifier = nullifier as string
  const safeNetwork = network as 'preview' | 'preprod'

  try {
    const sql = database()
    const rows = await sql`
      INSERT INTO proof_receipts (tx_id, ballot_id, network, nullifier, disclosure_scope, finalized_at)
      VALUES (${safeTxId}, ${safeBallotId}, ${safeNetwork}, ${safeNullifier}, 'eligibility_valid,nullifier', NOW())
      RETURNING finalized_at
    `
    return json({ tx_id: safeTxId, ballot_id: safeBallotId, network: safeNetwork, nullifier: safeNullifier, outcome: 'accepted', finalized_at: String(rows[0]?.finalized_at ?? '') }, 201, { 'Cache-Control': 'no-store' })
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    return json({ error: code === '23505' ? 'Duplicate transaction or nullifier.' : 'Receipt service is temporarily unavailable.' }, code === '23505' ? 409 : 503, { 'Cache-Control': 'no-store' })
  }
}

export default async (request: Request, _context: Context) => {
  void _context
  const cors = corsHeaders(request)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...BASE_HEADERS, ...cors, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
  }

  const route = routeFor(request)
  let response: Response
  try {
    if (request.method === 'GET' && route === '/health') response = await health()
    else if (request.method === 'GET' && route === '/metrics') response = await metrics()
    else if (request.method === 'POST' && route === '/policy-plan') response = await policyPlan(request)
    else if (request.method === 'POST' && route === '/receipts') response = await createReceipt(request)
    else response = json({ error: 'Not found.' }, 404)
  } catch {
    response = json({ error: 'Public service is temporarily unavailable.' }, 503, { 'Cache-Control': 'no-store' })
  }
  Object.entries(cors).forEach(([key, value]) => response.headers.set(key, value))
  return response
}

export const config: Config = {
  path: ['/api/health', '/api/metrics', '/api/policy-plan', '/api/receipts'],
  rateLimit: { action: 'rate_limit', aggregateBy: ['ip'], windowLimit: 60, windowSize: 60 },
}
