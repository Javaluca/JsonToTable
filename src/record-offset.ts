export type SourceRange = { start: number; end: number }

function firstNonSpace(text: string): number {
  for (let i = 0; i < text.length; i++) {
    if (!/\s/.test(text[i])) return i
  }
  return -1
}

function isSpace(text: string, at: number): boolean {
  return /\s/.test(text[at])
}

/** The offset just past the JSON value that begins at `start`, or -1. */
function valueEnd(text: string, start: number): number {
  const opening = text[start]
  if (opening === '{' || opening === '[') {
    let depth = 0
    let inString = false
    let escaped = false
    for (let i = start; i < text.length; i++) {
      const char = text[i]
      if (inString) {
        if (escaped) escaped = false
        else if (char === '\\') escaped = true
        else if (char === '"') inString = false
        continue
      }
      if (char === '"') inString = true
      else if (char === '{' || char === '[') depth++
      else if (char === '}' || char === ']') {
        depth--
        if (depth === 0) return i + 1
      }
    }
    return -1
  }
  if (opening === '"') {
    let escaped = false
    for (let i = start + 1; i < text.length; i++) {
      const char = text[i]
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') return i + 1
    }
    return -1
  }
  let i = start
  while (i < text.length && !isSpace(text, i) && !',}]'.includes(text[i])) i++
  return i
}

function skipSeparators(text: string, from: number): number {
  let i = from
  while (i < text.length && (isSpace(text, i) || text[i] === ',')) i++
  return i >= text.length ? -1 : i
}

/** Trims the trailing whitespace of `text` between `from` and `to`. */
function trimEndOf(text: string, from: number, to: number): number {
  let end = to
  while (end > from && isSpace(text, end - 1)) end--
  return end
}

/** The `index`th of several sibling values, one per line for NDJSON. */
function nthValue(text: string, first: number, index: number): SourceRange | null {
  let cursor = first
  for (let seen = 0; seen < index; seen++) {
    const end = valueEnd(text, cursor)
    if (end === -1) return null
    cursor = skipSeparators(text, end)
    if (cursor === -1) return null
  }
  const end = valueEnd(text, cursor)
  return end === -1 ? null : { start: cursor, end }
}

/** The `index`th element of the top-level array that opens at `open`. */
function nthElement(text: string, open: number, index: number): SourceRange | null {
  let depth = 0
  let inString = false
  let escaped = false
  let start = -1
  let seen = 0
  for (let i = open + 1; i < text.length; i++) {
    const char = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      if (depth === 0 && start === -1) start = i
      inString = true
      continue
    }
    if (char === '{' || char === '[') {
      if (depth === 0 && start === -1) start = i
      depth++
      continue
    }
    if (char === '}' || char === ']') {
      if (depth === 0) {
        if (seen === index && start !== -1) {
          return { start, end: trimEndOf(text, start, i) }
        }
        return null
      }
      depth--
      continue
    }
    if (char === ',' && depth === 0) {
      if (seen === index) return { start, end: trimEndOf(text, start, i) }
      seen++
      start = -1
      continue
    }
    if (depth === 0 && start === -1 && !isSpace(text, i)) start = i
  }
  return null
}

/**
 * Locates the `index`th Record inside the Dataset source, so the Input editor
 * can put the cursor on it. Handles a top-level JSON array, NDJSON, and a lone
 * Record.
 */
export function recordRange(text: string, index: number): SourceRange | null {
  if (index < 0) return null
  const first = firstNonSpace(text)
  if (first === -1) return null
  if (text[first] === '[') return nthElement(text, first, index)
  return nthValue(text, first, index)
}

/**
 * Locates the `"key":` of a Record's own property, so selecting a cell can put
 * the cursor on the JSON that produced it.
 */
export function fieldRange(
  text: string,
  record: SourceRange,
  key: string,
): SourceRange | null {
  const needle = `"${key}"`
  let from = record.start
  while (from < record.end) {
    const at = text.indexOf(needle, from)
    if (at === -1 || at + needle.length > record.end) return null
    let after = at + needle.length
    while (after < record.end && isSpace(text, after)) after++
    if (text[after] === ':') return { start: at, end: after + 1 }
    from = at + needle.length
  }
  return null
}
