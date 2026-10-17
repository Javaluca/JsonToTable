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

  it('labels a Dataset with a hint from its first Record', () => {
    const store = createDatasetStore(createStorageStub())

    const entries = store.add('[{"id":1,\n  "name":"Ada"}]', 1)

    expect(entries[0].label).toContain('Ada')
    expect(entries[0].label).not.toContain('{"id"')
  })

  it('falls back to a text preview when the text is not one JSON array', () => {
    const store = createDatasetStore(createStorageStub())

    const entries = store.add('{"id":1}\n{"id":2}', 2)

    expect(entries[0].label).toContain('{"id":1}')
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
    storage.setItem('json-to-table:datasets', 'not json')

    expect(createDatasetStore(storage).list()).toEqual([])
  })

  it('uses a custom name for the label when one is given', () => {
    const store = createDatasetStore(createStorageStub())

    const entries = store.add('[{"id":1},{"id":2}]', 2, 'People')

    expect(entries[0].label).toContain('People')
    expect(entries[0].label).toContain('2 Records')
    expect(entries[0].name).toBe('People')
  })

  it('ignores a blank custom name', () => {
    const store = createDatasetStore(createStorageStub())

    const entries = store.add('[{"id":1}]', 1, '   ')

    expect(entries[0].label).toContain('1 Record')
    expect(entries[0].name).toBeUndefined()
  })

  it('updates a Dataset in place, keeping its id and custom name', () => {
    const store = createDatasetStore(createStorageStub())
    const created = store.add('[{"id":1}]', 1, 'People')

    const entries = store.update(created[0].id, '[{"id":1},{"id":2}]', 2)

    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe(created[0].id)
    expect(entries[0].name).toBe('People')
    expect(entries[0].label).toContain('People')
    expect(entries[0].label).toContain('2 Records')
    expect(entries[0].text).toBe('[{"id":1},{"id":2}]')
  })

  it('removes a Dataset by id', () => {
    const store = createDatasetStore(createStorageStub())
    store.add('[{"id":1}]', 1)
    const entries = store.add('[{"id":2}]', 2)

    const remaining = store.remove(entries[1].id)

    expect(remaining).toHaveLength(1)
    expect(remaining[0].text).toBe('[{"id":2}]')
    expect(store.list()).toHaveLength(1)
  })

  it('reads Datasets written under the previous storage key', () => {
    const storage = createStorageStub()
    storage.setItem(
      'json-query-table:datasets',
      JSON.stringify([
        {
          id: 'legacy',
          label: '1 Record · old',
          savedAt: 1,
          recordCount: 1,
          text: '[{"id":1}]',
        },
      ]),
    )

    expect(createDatasetStore(storage).list()).toHaveLength(1)
  })
})
