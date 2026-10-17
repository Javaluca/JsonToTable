const NEEDS_QUOTING = /[\s"():<>!=]/

export function quoteClauseValue(text: string): string {
  return NEEDS_QUOTING.test(text) ? `"${text}"` : text
}

export function clauseFor(path: string, value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'object') return null
  if (typeof value === 'string' && value === '') return null
  return `${path}:${quoteClauseValue(String(value))}`
}

export function refineQuery(current: string, clause: string): string {
  const trimmed = current.trim()
  if (trimmed === '') return clause
  return `(${trimmed}) AND ${clause}`
}
