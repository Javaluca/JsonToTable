import { describe, expect, it } from 'vitest'
import { fieldRange, recordRange } from './record-offset'

const ARRAY = `[
  { "id": 1, "name": "Ada", "address": { "city": "London" } },
  { "id": 2, "name": "Grace", "address": { "city": "New York" } }
]`

function slice(text: string, range: { start: number; end: number } | null) {
  return range === null ? null : text.slice(range.start, range.end)
}

describe('recordRange', () => {
  it('finds each Record of a JSON array', () => {
    const first = recordRange(ARRAY, 0)
    const second = recordRange(ARRAY, 1)

    expect(slice(ARRAY, first)).toBe(
      '{ "id": 1, "name": "Ada", "address": { "city": "London" } }',
    )
    expect(slice(ARRAY, second)).toBe(
      '{ "id": 2, "name": "Grace", "address": { "city": "New York" } }',
    )
  })

  it('is not fooled by braces or commas inside strings', () => {
    const text = '[{"note":"a, } b"},{"note":"c"}]'

    expect(slice(text, recordRange(text, 1))).toBe('{"note":"c"}')
  })

  it('finds a Record of NDJSON by line', () => {
    const text = '{"id":1}\n\n{"id":2}\n{"id":3}'

    expect(slice(text, recordRange(text, 0))).toBe('{"id":1}')
    expect(slice(text, recordRange(text, 1))).toBe('{"id":2}')
    expect(slice(text, recordRange(text, 2))).toBe('{"id":3}')
  })

  it('points at a lone Record', () => {
    expect(slice('{"id":1}', recordRange('{"id":1}', 0))).toBe('{"id":1}')
  })

  it('gives nothing back for an index it does not hold', () => {
    expect(recordRange(ARRAY, 9)).toBeNull()
    expect(recordRange('', 0)).toBeNull()
  })
})

describe('fieldRange', () => {
  it('finds the key of a field, nested or not', () => {
    const record = recordRange(ARRAY, 1)!

    expect(slice(ARRAY, fieldRange(ARRAY, record, 'name'))).toBe('"name":')
    expect(slice(ARRAY, fieldRange(ARRAY, record, 'city'))).toBe('"city":')
  })

  it('ignores a value that happens to read like the key', () => {
    const text = '[{"city":"city"},{"city":"Paris"}]'
    const record = recordRange(text, 1)!

    expect(slice(text, fieldRange(text, record, 'city'))).toBe('"city":')
  })

  it('gives nothing back for a field the Record does not hold', () => {
    const record = recordRange(ARRAY, 0)!

    expect(fieldRange(ARRAY, record, 'nope')).toBeNull()
  })
})
