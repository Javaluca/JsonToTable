export type HistoryEntry = {
  id: string
  label: string
  savedAt: number
  recordCount: number
  text: string
}

export type DatasetHistory = {
  list: () => HistoryEntry[]
  save: (text: string, recordCount: number) => HistoryEntry[]
  clear: () => void
}

const STORAGE_KEY = 'json-query-table:datasets'
const MAX_ENTRIES = 10

export function createDatasetHistory(
  storage: Storage,
  now: () => number = Date.now,
): DatasetHistory {
  function read(): HistoryEntry[] {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return []
    try {
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter(isHistoryEntry) : []
    } catch {
      return []
    }
  }

  function write(entries: HistoryEntry[]): void {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }

  return {
    list: read,

    save(text, recordCount) {
      const savedAt = now()
      const entry: HistoryEntry = {
        id: createId(savedAt),
        label: `${recordCount} ${recordCount === 1 ? 'Record' : 'Records'} · ${new Date(savedAt).toLocaleTimeString()}`,
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

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<HistoryEntry>
  return typeof candidate.text === 'string' && typeof candidate.label === 'string'
}

function createId(savedAt: number): string {
  return `${savedAt}-${Math.random().toString(36).slice(2, 10)}`
}
