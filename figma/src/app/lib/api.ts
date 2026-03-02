export const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://travel-capsule-worker.netson94.workers.dev'

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(WORKER_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(WORKER_URL + path)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}
