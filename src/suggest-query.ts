import { deriveColumns } from './derive-columns'
import { isJsonObject, type JsonRecord } from './parse-dataset'
import { quoteClauseValue } from './query-clause'

const QUOTED_VALUE = /([\w.-]+):(>=|<=|!=|>|<|=)?"([^"]*)$/
const BARE_VALUE = /([\w.-]+):(>=|<=|!=|>|<|=)?([^"()\s]*)$/
const TRAILING_TOKEN = /[^\s()]*$/

const MAX_SUGGESTIONS = 20
const MAX_CANDIDATES = 500

export type SuggestionKind = 'field' | 'value'

export type QuerySuggestion = {
  kind: SuggestionKind
  value: string
  replaceFrom: number
  replaceTo: number
}

export function suggestQuery(
  records: JsonRecord[],
  queryText: string,
  caret: number,
): QuerySuggestion[] {
  const position = Math.max(0, Math.min(caret, queryText.length))
  const before = queryText.slice(0, position)

  const quoted = QUOTED_VALUE.exec(before)
  if (quoted !== null) {
    const partial = quoted[3]
    return valuesFor(
      records,
      quoted[1],
      partial,
      position - partial.length - 1,
      position,
    )
  }

  const bare = BARE_VALUE.exec(before)
  if (bare !== null) {
    const partial = bare[3]
    return valuesFor(records, bare[1], partial, position - partial.length, position)
  }

  const token = TRAILING_TOKEN.exec(before)?.[0] ?? ''
  return fieldsFor(records, token, position - token.length, position)
}

function valuesFor(
  records: JsonRecord[],
  path: string,
  partial: string,
  replaceFrom: number,
  replaceTo: number,
): QuerySuggestion[] {
  return rank(collectValues(records, path), partial).map((text) => ({
    kind: 'value' as const,
    value: quoteClauseValue(text),
    replaceFrom,
    replaceTo,
  }))
}

function fieldsFor(
  records: JsonRecord[],
  partial: string,
  replaceFrom: number,
  replaceTo: number,
): QuerySuggestion[] {
  const fields = deriveColumns(records).map((column) => column.field)
  return rank(fields, partial).map((field) => ({
    kind: 'field' as const,
    value: field,
    replaceFrom,
    replaceTo,
  }))
}

function collectValues(records: JsonRecord[], path: string): string[] {
  const values: string[] = []
  const seen = new Set<string>()

  for (const record of records) {
    for (const value of valuesAtPath(record, path)) {
      const text = stringifyValue(value)
      if (text === null || seen.has(text)) continue
      seen.add(text)
      values.push(text)
      if (values.length >= MAX_CANDIDATES) return values
    }
  }

  return values
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

function rank(candidates: string[], partial: string): string[] {
  const needle = partial.toLowerCase()
  const starts: string[] = []
  const contains: string[] = []

  for (const candidate of candidates) {
    const lower = candidate.toLowerCase()
    if (lower.startsWith(needle)) starts.push(candidate)
    else if (lower.includes(needle)) contains.push(candidate)
  }

  return [...starts, ...contains].slice(0, MAX_SUGGESTIONS)
}
