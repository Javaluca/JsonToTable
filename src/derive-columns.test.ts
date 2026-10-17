import { describe, expect, it } from 'vitest'
import { deriveColumns } from './derive-columns'

describe('deriveColumns', () => {
  it('derives Columns as the union of top-level Field paths, in first-seen order', () => {
    const columns = deriveColumns([
      { id: 1, name: 'Ada' },
      { id: 2, email: 'a@x.io' },
    ])
    expect(columns).toEqual([
      { field: 'id' },
      { field: 'name' },
      { field: 'email' },
    ])
  })

  it('expands nested objects into dot-path Columns, depth-first', () => {
    const columns = deriveColumns([
      { user: { name: 'Ada', contact: { email: 'a@x.io' } }, id: 1 },
    ])
    expect(columns).toEqual([
      { field: 'user.name' },
      { field: 'user.contact.email' },
      { field: 'id' },
    ])
  })

  it('keeps array values as leaf Columns', () => {
    const columns = deriveColumns([{ tags: ['a', 'b'], id: 1 }])
    expect(columns).toEqual([{ field: 'tags' }, { field: 'id' }])
  })

  it('returns no Columns for an empty Dataset', () => {
    expect(deriveColumns([])).toEqual([])
  })
})
