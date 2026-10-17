import { isJsonObject, type JsonRecord } from './parse-dataset'

export type Column = { field: string }

export function deriveColumns(records: JsonRecord[]): Column[] {
  const fields: string[] = []
  const seen = new Set<string>()
  for (const record of records) {
    collectLeafPaths(record, '', fields, seen)
  }
  return fields.map((field) => ({ field }))
}

function collectLeafPaths(
  record: JsonRecord,
  prefix: string,
  fields: string[],
  seen: Set<string>,
): void {
  for (const key of Object.keys(record)) {
    const path = prefix === '' ? key : `${prefix}.${key}`
    const value = record[key]
    if (isJsonObject(value)) {
      collectLeafPaths(value, path, fields, seen)
      continue
    }
    if (!seen.has(path)) {
      seen.add(path)
      fields.push(path)
    }
  }
}
