export type PublicMetrics = { finalized_proofs: number; public_only: true }
export type PolicyPlan = { summary: string; disclosures: string[]; private_by_default: string[]; caution: string; source: 'gemini' | 'local-fallback' }

const baseUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')
const retryableStatuses = new Set([502, 503, 504])
const wakeDelayMs = 1_200
const requestTimeoutMs = 25_000

function pause(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs)
    try {
      const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, signal: controller.signal })
      if (response.ok) return response.json() as Promise<T>
      if (attempt === 0 && retryableStatuses.has(response.status)) {
        await pause(wakeDelayMs)
        continue
      }
      throw new Error(`Public service is unavailable (${response.status}).`)
    } catch (error) {
      const transportFailure = error instanceof TypeError || (error instanceof DOMException && error.name === 'AbortError')
      if (attempt === 0 && transportFailure) {
        await pause(wakeDelayMs)
        continue
      }
      throw error
    } finally {
      window.clearTimeout(timeout)
    }
  }
  throw new Error('Public service is unavailable.')
}

export function getMetrics() { return request<PublicMetrics>('/metrics') }
export function getPolicyPlan(publicRequirement: string) { return request<PolicyPlan>('/policy-plan', { method: 'POST', body: JSON.stringify({ public_requirement: publicRequirement }) }) }
