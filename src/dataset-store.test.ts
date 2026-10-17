import { describe, expect, it } from 'vitest'
import { createDatasetStore } from './dataset-store'

function createStorageStub(): Storage {
  const entries = new Map<string, string>()
  return {
    get length() {
      return entries.size
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key) => {
      entries.delete(key)
    },
    setItem: (key, value) => {
      entries.set(key, value)
    },
  }
}

describe('createDatasetStore', () => {
  it('adds a Dataset with a label naming its Record count', () => {
    const store = createDatasetStore(createStorageStub())

    const entries = store.add('[{"id":1}]', 1)

    expect(entries).toHaveLength(1)
    expect(entries[0].label).toContain('1 Record')
    expect(entries[0].text).toBe('[{"id":1}]')
  })

  it('labels a Dataset with a preview of its text', () => {
    const store = createDatasetStore(createStorageStub())

    const entries = store.add('[{"id":1,\n  "name":"Ada"}]', 1)

    expect(entries[0].label).toContain('[{"id":1, "name":"Ada"}]')
  })

  it('keeps at most ten Datasets, dropping the oldest', () => {
    const store = createDatasetStore(createStorageStub())

    for (let index = 1; index <= 11; index++) {
      store.add(`[{"id":${index}}]`, index)
    }

    const entries = store.list()
    expect(entries).toHaveLength(10)
    expect(entries[0].text).toBe('[{"id":11}]')
    expect(entries.some((entry) => entry.text === '[{"id":1}]')).toBe(false)
  })

  it('moves a re-added Dataset to the front without duplicating it', () => {
    const store = createDatasetStore(createStorageStub())
    store.add('[{"id":1}]', 1)
    store.add('[{"id":2}]', 2)

    const entries = store.add('[{"id":1}]', 1)

    expect(entries).toHaveLength(2)
    expect(entries[0].text).toBe('[{"id":1}]')
  })

  it('gives each Dataset a distinct id', () => {
    const store = createDatasetStore(createStorageStub())

    store.add('[{"id":1}]', 1)
    const entries = store.add('[{"id":2}]', 1)

    expect(entries[0].id).not.toBe(entries[1].id)
  })

  it('survives corrupt stored data', () => {
    const storage = createStorageStub()
    storage.setItem('json-query-table:datasets', 'not json')

    expect(createDatasetStore(storage).list()).toEqual([])
  })
})
