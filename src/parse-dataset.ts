export type JsonRecord = { [key: string]: unknown }

export type ParseSuccess = { ok: true; records: JsonRecord[] }
export type ParseFailure = { ok: false; error: string; line?: number }
export type ParseResult = ParseSuccess | ParseFailure

export function parseDataset(text: string): ParseResult {
  if (text.trim() === '') {
    return { ok: false, error: 'No Records found in input' }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return parseNdjson(text)
  }
  if (Array.isArray(parsed)) {
    for (let i = 0; i < parsed.length; i++) {
      if (!isJsonObject(parsed[i])) {
        return {
          ok: false,
          error: `Record at index ${i} is not a JSON object`,
        }
      }
    }
    return { ok: true, records: parsed as JsonRecord[] }
  }
  if (isJsonObject(parsed)) {
    return { ok: true, records: [parsed] }
  }
  return { ok: false, error: 'Expected a JSON array of Records' }
}

function parseNdjson(text: string): ParseResult {
  const records: JsonRecord[] = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '') continue
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
  return { ok: true, records }
}

export function isJsonObject(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
