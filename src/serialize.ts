import type { JsonRecord } from './parse-dataset'

export function toJsonText(records: JsonRecord[]): string {
  return JSON.stringify(records, null, 2)
}

export function downloadName(now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `result-set-${stamp}.json`
}
