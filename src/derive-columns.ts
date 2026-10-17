import { isJsonObject, type JsonRecord } from './parse-dataset'

export type Column = { field: string; sample: string; numeric: boolean }

type ColumnAccumulator = {
  sample: string
  numeric: boolean
  hasValue: boolean
}

export function deriveColumns(records: JsonRecord[]): Column[] {
  const found = new Map<string, ColumnAccumulator>()
  for (const record of records) {
    collectLeafValues(record, '', found)
  }
  return [...found].map(([field, acc]) => ({
    field,
    sample: acc.sample,
    numeric: acc.numeric,
  }))
}

function collectLeafValues(
  record: JsonRecord,
  prefix: string,
  found: Map<string, ColumnAccumulator>,
): void {
  for (const key of Object.keys(record)) {
    const path = prefix === '' ? key : `${prefix}.${key}`
    const value = record[key]
    if (isJsonObject(value)) {
      collectLeafValues(value, path, found)
      continue
    }
    const hasValue = value !== null && value !== undefined
    const sample = sampleOf(value)
    const existing = found.get(path)
    if (existing === undefined) {
      found.set(path, {
        sample,
        numeric: hasValue && isNumeric(value),
        hasValue,
      })
      continue
    }
    if (hasValue) {
      existing.numeric = existing.hasValue
        ? existing.numeric && isNumeric(value)
        : isNumeric(value)
      existing.hasValue = true
      if (existing.sample === '' && sample !== '') existing.sample = sample
    }
  }
}

function isNumeric(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value)
}

function sampleOf(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
