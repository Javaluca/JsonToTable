import { isJsonObject, type JsonRecord } from './parse-dataset'

const TYPED_CLAUSE = /([\w.]+):([^\s]*)$/
const MAX_SUGGESTIONS = 20

export function suggestValues(
  records: JsonRecord[],
  queryText: string,
): string[] {
  const match = TYPED_CLAUSE.exec(queryText)
  if (match === null) return []

  const path = match[1]
  const prefix = match[2].replace(/^["']/, '').toLowerCase()

  const suggestions: string[] = []
  const seen = new Set<string>()

  for (const record of records) {
    for (const value of valuesAtPath(record, path)) {
      const text = stringifyValue(value)
      if (text === null) continue
      if (!text.toLowerCase().includes(prefix)) continue
      if (seen.has(text)) continue
      seen.add(text)
      suggestions.push(quoteIfNeeded(text))
      if (suggestions.length >= MAX_SUGGESTIONS) return suggestions
    }
  }

  return suggestions
}

function valuesAtPath(record: JsonRecord, path: string): unknown[] {
  let current: unknown = record
  for (const segment of path.split('.')) {
    if (!isJsonObject(current)) return []
    current = current[segment]
  }
  return Array.isArray(current) ? current : [current]
}

function stringifyValue(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'object') return null
  const text = String(value)
  return text === '' ? null : text
}

function quoteIfNeeded(text: string): string {
  return /\s/.test(text) ? `"${text}"` : text
}
