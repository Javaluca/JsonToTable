import { describe, expect, it } from 'vitest'
import { deriveColumns } from './derive-columns'

describe('deriveColumns', () => {
  it('derives Columns as the union of Field paths, in first-seen order', () => {
    const columns = deriveColumns([
      { id: 1, name: 'Ada' },
      { id: 2, email: 'a@x.io' },
    ])
    expect(columns).toEqual([
      { field: 'id', sample: '1', numeric: true },
      { field: 'name', sample: 'Ada', numeric: false },
      { field: 'email', sample: 'a@x.io', numeric: false },
    ])
  })

  it('expands nested objects into dot-path Columns, depth-first', () => {
    const columns = deriveColumns([
      { user: { name: 'Ada', contact: { email: 'a@x.io' } }, id: 1 },
    ])
    expect(columns).toEqual([
      { field: 'user.name', sample: 'Ada', numeric: false },
      { field: 'user.contact.email', sample: 'a@x.io', numeric: false },
      { field: 'id', sample: '1', numeric: true },
    ])
  })

  it('keeps array values as leaf Columns and shows their JSON as the sample', () => {
    const columns = deriveColumns([{ tags: ['a', 'b'], id: 1 }])
    expect(columns).toEqual([
      { field: 'tags', sample: '["a","b"]', numeric: false },
      { field: 'id', sample: '1', numeric: true },
    ])
  })

  it('keeps a sample from a later Record when the first is empty', () => {
    const columns = deriveColumns([
      { nickname: null, id: 1 },
      { nickname: 'Ada', id: 2 },
    ])
    expect(columns[0]).toEqual({
      field: 'nickname',
      sample: 'Ada',
      numeric: false,
    })
  })

  it('leaves the sample empty when no Record carries a value', () => {
    const columns = deriveColumns([{ nickname: null }])
    expect(columns).toEqual([{ field: 'nickname', sample: '', numeric: false }])
  })

  it('marks a Column numeric only when every value is a number', () => {
    const columns = deriveColumns([
      { score: 1, mixed: 1 },
      { score: 2, mixed: 'three' },
      { score: null, mixed: 4 },
    ])
    expect(columns).toEqual([
      { field: 'score', sample: '1', numeric: true },
      { field: 'mixed', sample: '1', numeric: false },
    ])
  })

  it('marks a Column numeric when an earlier Record held no value', () => {
    const columns = deriveColumns([{ score: null }, { score: 3 }])
    expect(columns).toEqual([{ field: 'score', sample: '3', numeric: true }])
  })

  it('returns no Columns for an empty Dataset', () => {
    expect(deriveColumns([])).toEqual([])
  })
})
