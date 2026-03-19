export function getQueryInt(query: Record<string, unknown>, key: string, fallback: number): number {
  const raw = query[key]
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export function getQueryString(query: Record<string, unknown>, key: string): string | undefined {
  const raw = query[key]
  if (raw == null) return undefined
  const s = String(raw).trim()
  return s.length ? s : undefined
}

