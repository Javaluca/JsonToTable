import { describe, expect, it } from 'vitest'
import { parseDataset, type ParseProgress } from './parse-dataset'

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

describe('parseDataset progress', () => {
  function collect(text: string): ParseProgress[] {
    const seen: ParseProgress[] = []
    parseDataset(text, (progress) => seen.push(progress))
    return seen
  }

  it('counts the Records it checks', () => {
    const rows = Array.from({ length: 25000 }, (_, id) => `{"id":${id}}`)
    const seen = collect(`[${rows.join(',')}]`)

    expect(seen.length).toBeGreaterThan(1)
    expect(seen[0]).toEqual({
      value: 1 / 25000,
      label: 'Checking Record 1 of 25000',
    })
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i].value).toBeGreaterThanOrEqual(seen[i - 1].value ?? 0)
    }
    expect(seen[seen.length - 1]).toEqual({
      value: 1,
      label: 'Checking Record 25000 of 25000',
    })
  })

  it('measures NDJSON line by line', () => {
    const lines = Array.from({ length: 2500 }, (_, id) => `{"id":${id}}`)
    const seen = collect(lines.join('\n'))

    expect(seen.length).toBeGreaterThan(1)
    expect(seen[0]).toEqual({ value: 1 / 2500, label: 'Reading line 1 of 2500' })
    expect(seen[seen.length - 1].value).toBe(1)
  })

  it('reports both ends of a two-Record Dataset', () => {
    expect(collect('[{"id":1},{"id":2}]')).toEqual([
      { value: 0.5, label: 'Checking Record 1 of 2' },
      { value: 1, label: 'Checking Record 2 of 2' },
    ])
  })
})
