import { describe, expect, it } from 'vitest'
import type { JsonRecord } from './parse-dataset'
import { recordFields } from './record-fields'

const RECORD: JsonRecord = {
  id: 1,
  name: 'Grace Hopper',
  age: 85,
  retired: true,
  nickname: null,
  tags: ['navy', 'navy', 'compiler'],
  address: { city: 'New York', geo: { lat: 40.7 } },
  meta: {},
}

function paths(record: JsonRecord): string[] {
  return recordFields(record).map((field) => field.path)
}

describe('recordFields', () => {
  it('walks nested objects into dot paths', () => {
    expect(paths(RECORD)).toEqual([
      'id',
      'name',
      'age',
      'retired',
      'nickname',
      'tags',
      'address.city',
      'address.geo.lat',
      'meta',
    ])
  })

  it('offers a clause for a leaf value, quoting when needed', () => {
    const name = recordFields(RECORD).find((field) => field.path === 'name')

    expect(name?.kind).toBe('text')
    expect(name?.display).toBe('Grace Hopper')
    expect(name?.options).toEqual([
      { label: 'Grace Hopper', clause: 'name:"Grace Hopper"' },
    ])
  })

  it('offers one clause per distinct array element', () => {
    const tags = recordFields(RECORD).find((field) => field.path === 'tags')

    expect(tags?.kind).toBe('array')
    expect(tags?.display).toBe('["navy","navy","compiler"]')
    expect(tags?.options).toEqual([
      { label: 'navy', clause: 'tags:navy' },
      { label: 'compiler', clause: 'tags:compiler' },
    ])
  })

  it('reports kinds for numbers, booleans and nulls', () => {
    const fields = recordFields(RECORD)
    const kindOf = (path: string) =>
      fields.find((field) => field.path === path)?.kind

    expect(kindOf('id')).toBe('number')
    expect(kindOf('retired')).toBe('boolean')
    expect(kindOf('nickname')).toBe('null')
    expect(kindOf('meta')).toBe('object')
  })

  it('offers no clause for values that cannot be queried', () => {
    const fields = recordFields(RECORD)
    const optionsOf = (path: string) =>
      fields.find((field) => field.path === path)?.options

    expect(optionsOf('nickname')).toEqual([])
    expect(optionsOf('meta')).toEqual([])
  })

  it('keeps array element display values as written', () => {
    const options = recordFields({ scores: [1, 2, 2] })[0].options

    expect(options).toEqual([
      { label: '1', clause: 'scores:1' },
      { label: '2', clause: 'scores:2' },
    ])
  })
})
