import { isJsonObject, type JsonRecord } from './parse-dataset'
import { clauseFor } from './query-clause'

export type FieldKind =
  | 'text'
  | 'number'
  | 'boolean'
  | 'null'
  | 'array'
  | 'object'

export type FieldOption = { label: string; clause: string }

export type RecordField = {
  path: string
  display: string
  kind: FieldKind
  options: FieldOption[]
}

const MAX_OPTIONS = 8

export function recordFields(record: JsonRecord): RecordField[] {
  const rows: RecordField[] = []
  collect(record, '', rows)
  return rows
}

function collect(record: JsonRecord, prefix: string, rows: RecordField[]): void {
  for (const key of Object.keys(record)) {
    const path = prefix === '' ? key : `${prefix}.${key}`
    append(path, record[key], rows)
  }
}

function append(path: string, value: unknown, rows: RecordField[]): void {
  if (isJsonObject(value)) {
    if (Object.keys(value).length === 0) {
      rows.push({ path, display: '{}', kind: 'object', options: [] })
      return
    }
    collect(value, path, rows)
    return
  }
  if (Array.isArray(value)) {
    rows.push({
      path,
      display: JSON.stringify(value),
      kind: 'array',
      options: arrayOptions(path, value),
    })
    return
  }
  const clause = clauseFor(path, value)
  rows.push({
    path,
    display: displayValue(value),
    kind: kindOf(value),
    options: clause === null ? [] : [{ label: displayValue(value), clause }],
  })
}

function arrayOptions(path: string, values: unknown[]): FieldOption[] {
  const seen = new Set<string>()
  const options: FieldOption[] = []
  for (const value of values) {
    const clause = clauseFor(path, value)
    if (clause === null) continue
    const label = displayValue(value)
    if (seen.has(label)) continue
    seen.add(label)
    options.push({ label, clause })
    if (options.length === MAX_OPTIONS) break
  }
  return options
}

function displayValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return ''
  return String(value)
}

function kindOf(value: unknown): FieldKind {
  if (value === null) return 'null'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'text'
}
