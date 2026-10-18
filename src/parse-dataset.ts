export type JsonRecord = { [key: string]: unknown }

export type ParseSuccess = { ok: true; records: JsonRecord[] }
export type ParseFailure = { ok: false; error: string; line?: number }
export type ParseResult = ParseSuccess | ParseFailure

/**
 * `value` is the fraction of the work that is done, or `null` when the step
 * cannot report a share of the total (a single `JSON.parse`, say).
 */
export type ParseProgress = { value: number | null; label: string }
export type ParseProgressSink = (progress: ParseProgress) => void

const CHUNK = 5000

export function parseDataset(
  text: string,
  onProgress?: ParseProgressSink,
): ParseResult {
  if (text.trim() === '') {
    return { ok: false, error: 'No Records found in input' }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return parseNdjson(text, onProgress)
  }
  if (Array.isArray(parsed)) {
    const total = parsed.length
    for (let i = 0; i < total; i++) {
      if (!isJsonObject(parsed[i])) {
        return {
          ok: false,
          error: `Record at index ${i} is not a JSON object`,
        }
      }
      if (i % CHUNK === 0 || i === total - 1) {
        reportChecking(onProgress, i + 1, total)
      }
    }
    return { ok: true, records: parsed as JsonRecord[] }
  }
  if (isJsonObject(parsed)) {
    return { ok: true, records: [parsed] }
  }
  return { ok: false, error: 'Expected a JSON array of Records' }
}

function reportChecking(
  onProgress: ParseProgressSink | undefined,
  done: number,
  total: number,
): void {
  onProgress?.({
    value: total === 0 ? 1 : done / total,
    label: `Checking Record ${done} of ${total}`,
  })
}

function parseNdjson(
  text: string,
  onProgress?: ParseProgressSink,
): ParseResult {
  const records: JsonRecord[] = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line !== '') {
      let value: unknown
      try {
        value = JSON.parse(line)
      } catch {
        return { ok: false, error: `Invalid JSON on line ${i + 1}`, line: i + 1 }
      }
      if (!isJsonObject(value)) {
        return {
          ok: false,
          error: `Line ${i + 1} is not a JSON object`,
          line: i + 1,
        }
      }
      records.push(value)
    }
    if (i % CHUNK === 0 || i === lines.length - 1) {
      onProgress?.({
        value: lines.length === 0 ? 1 : (i + 1) / lines.length,
        label: `Reading line ${i + 1} of ${lines.length}`,
      })
    }
  }
  return { ok: true, records }
}

export function isJsonObject(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
