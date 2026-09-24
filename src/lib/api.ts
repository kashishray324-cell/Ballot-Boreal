export type PublicMetrics = { finalized_proofs: number; public_only: true }
export type PolicyPlan = { summary: string; disclosures: string[]; private_by_default: string[]; caution: string; source: 'gemini' | 'local-fallback' }

const baseUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8_000)
  try {
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, signal: controller.signal })
    if (!response.ok) throw new Error(`Public service is unavailable (${response.status}).`)
    return response.json() as Promise<T>
  } finally {
    window.clearTimeout(timeout)
  }
}

export function getMetrics() { return request<PublicMetrics>('/metrics') }
export function getPolicyPlan(publicRequirement: string) { return request<PolicyPlan>('/policy-plan', { method: 'POST', body: JSON.stringify({ public_requirement: publicRequirement }) }) }
