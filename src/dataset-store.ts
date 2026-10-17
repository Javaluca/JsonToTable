export type DatasetEntry = {
  id: string
  label: string
  savedAt: number
  recordCount: number
  text: string
}

export type DatasetStore = {
  list: () => DatasetEntry[]
  add: (text: string, recordCount: number) => DatasetEntry[]
  clear: () => void
}

const STORAGE_KEY = 'json-query-table:datasets'
const MAX_ENTRIES = 10
const PREVIEW_LENGTH = 40

export function createDatasetStore(
  storage: Storage,
  now: () => number = Date.now,
): DatasetStore {
  function read(): DatasetEntry[] {
    const raw = storage.getItem(STORAGE_KEY)
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

    add(text, recordCount) {
      const savedAt = now()
      const entry: DatasetEntry = {
        id: createId(savedAt),
        label: `${recordCount} ${recordCount === 1 ? 'Record' : 'Records'} · ${preview(text)}`,
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

    clear() {
      storage.removeItem(STORAGE_KEY)
    },
  }
}

function preview(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact === '') return 'empty'
  return compact.length > PREVIEW_LENGTH
    ? `${compact.slice(0, PREVIEW_LENGTH)}…`
    : compact
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
