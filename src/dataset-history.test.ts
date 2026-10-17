import { describe, expect, it } from 'vitest'
import { createDatasetHistory } from './dataset-history'

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

describe('createDatasetHistory', () => {
  it('saves a Dataset with a label naming its Record count', () => {
    const history = createDatasetHistory(createStorageStub())

    const entries = history.save('[{"id":1}]', 1)

    expect(entries).toHaveLength(1)
    expect(entries[0].label).toContain('1 Record')
    expect(entries[0].text).toBe('[{"id":1}]')
  })

  it('keeps at most ten Datasets, dropping the oldest', () => {
    const history = createDatasetHistory(createStorageStub())

    for (let index = 1; index <= 11; index++) {
      history.save(`[{"id":${index}}]`, index)
    }

    const entries = history.list()
    expect(entries).toHaveLength(10)
    expect(entries[0].text).toBe('[{"id":11}]')
    expect(entries.some((entry) => entry.text === '[{"id":1}]')).toBe(false)
  })

  it('moves a re-loaded Dataset to the front without duplicating it', () => {
    const history = createDatasetHistory(createStorageStub())
    history.save('[{"id":1}]', 1)
    history.save('[{"id":2}]', 2)

    const entries = history.save('[{"id":1}]', 1)

    expect(entries).toHaveLength(2)
    expect(entries[0].text).toBe('[{"id":1}]')
  })

  it('survives corrupt stored data', () => {
    const storage = createStorageStub()
    storage.setItem('json-query-table:datasets', 'not json')

    expect(createDatasetHistory(storage).list()).toEqual([])
  })
})
