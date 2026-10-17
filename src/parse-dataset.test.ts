import { describe, expect, it } from 'vitest'
import { parseDataset } from './parse-dataset'

describe('parseDataset', () => {
  it('parses a JSON array of Records', () => {
    const result = parseDataset('[{"id":1,"name":"Ada"},{"id":2,"name":"Grace"}]')
    expect(result).toEqual({
      ok: true,
      records: [
        { id: 1, name: 'Ada' },
        { id: 2, name: 'Grace' },
      ],
    })
  })

  it('parses NDJSON: one Record per line', () => {
    const result = parseDataset('{"id":1}\n{"id":2}\n{"id":3}')
    expect(result).toEqual({
      ok: true,
      records: [{ id: 1 }, { id: 2 }, { id: 3 }],
    })
  })

  it('reports the line number for invalid NDJSON', () => {
    const result = parseDataset('{"id":1}\n{"id":2}\nnot json\n{"id":4}')
    expect(result).toEqual({
      ok: false,
      error: 'Invalid JSON on line 3',
      line: 3,
    })
  })

  it('rejects an array containing non-object Records', () => {
    const result = parseDataset('[{"id":1}, 42, "hello"]')
    expect(result).toEqual({
      ok: false,
      error: 'Record at index 1 is not a JSON object',
    })
  })

  it('rejects empty input', () => {
    const result = parseDataset('   \n  ')
    expect(result).toEqual({
      ok: false,
      error: 'No Records found in input',
    })
  })

  it('accepts a bare JSON object as one Record', () => {
    const result = parseDataset('{"id":1}')
    expect(result).toEqual({ ok: true, records: [{ id: 1 }] })
  })

  it('skips blank lines in NDJSON', () => {
    const result = parseDataset('{"id":1}\n\n{"id":2}\n')
    expect(result).toEqual({ ok: true, records: [{ id: 1 }, { id: 2 }] })
  })
})
