export type DatasetEntry = {
  id: string
  label: string
  name?: string
  savedAt: number
  recordCount: number
  text: string
}

export type DatasetStore = {
  list: () => DatasetEntry[]
  add: (text: string, recordCount: number, name?: string) => DatasetEntry[]
  update: (id: string, text: string, recordCount: number) => DatasetEntry[]
  remove: (id: string) => DatasetEntry[]
  clear: () => void
}

const STORAGE_KEY = 'json-to-table:datasets'
const LEGACY_STORAGE_KEY = 'json-query-table:datasets'
const MAX_ENTRIES = 10
const PREVIEW_LENGTH = 40

export function createDatasetStore(
  storage: Storage,
  now: () => number = Date.now,
): DatasetStore {
  function read(): DatasetEntry[] {
    const raw =
      storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY)
    if (raw === null) return []
    try {
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter(isDatasetEntry) : []
    } catch {
      return []
    }
  }

  function write(entries: DatasetEntry[]): void {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }

  return {
    list: read,

    add(text, recordCount, name) {
      const savedAt = now()
      const custom = name?.trim() || undefined
      const entry: DatasetEntry = {
        id: createId(savedAt),
        label: labelFor(text, recordCount, custom),
        name: custom,
        savedAt,
        recordCount,
        text,
      }
      const entries = [
        entry,
        ...read().filter((existing) => existing.text !== text),
      ].slice(0, MAX_ENTRIES)
      write(entries)
      return entries
    },

    update(id, text, recordCount) {
      const entries = read().map((entry) =>
        entry.id === id
          ? {
              ...entry,
              text,
              recordCount,
              label: labelFor(text, recordCount, entry.name),
            }
          : entry,
      )
      write(entries)
      return entries
    },

    remove(id) {
      const entries = read().filter((entry) => entry.id !== id)
      write(entries)
      return entries
    },

    clear() {
      storage.removeItem(STORAGE_KEY)
      storage.removeItem(LEGACY_STORAGE_KEY)
    },
  }
}

function labelFor(
  text: string,
  recordCount: number,
  custom: string | undefined,
): string {
  const count = `${recordCount} ${recordCount === 1 ? 'Record' : 'Records'}`
  return custom !== undefined ? `${custom} · ${count}` : `${count} · ${preview(text)}`
}

const HINT_KEYS = ['name', 'title', 'label', 'id']

function preview(text: string): string {
  const hint = firstRecordHint(text)
  if (hint !== null) return hint
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact === '') return 'empty'
  return compact.length > PREVIEW_LENGTH
    ? `${compact.slice(0, PREVIEW_LENGTH)}…`
    : compact
}

function firstRecordHint(text: string): string | null {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return null
  }
  const first = Array.isArray(value) ? value[0] : value
  if (typeof first !== 'object' || first === null) return null
  const record = first as Record<string, unknown>
  for (const key of HINT_KEYS) {
    const candidate = record[key]
    if (typeof candidate === 'string' && candidate.trim() !== '') return candidate
    if (typeof candidate === 'number') return String(candidate)
  }
  for (const candidate of Object.values(record)) {
    if (typeof candidate === 'string' && candidate.trim() !== '') return candidate
  }
  return null
}

function isDatasetEntry(value: unknown): value is DatasetEntry {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<DatasetEntry>
  return (
    typeof candidate.text === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.id === 'string'
  )
}

function createId(savedAt: number): string {
  return `${savedAt}-${Math.random().toString(36).slice(2, 10)}`
}
