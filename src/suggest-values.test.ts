import { describe, expect, it } from 'vitest'
import { suggestValues } from './suggest-values'

describe('suggestValues', () => {
  const records = [
    { name: 'Ada', address: { city: 'London' }, tags: ['math', 'pioneer'] },
    { name: 'Alan', address: { city: 'London' }, tags: ['math', 'crypto'] },
    { name: 'Grace', address: { city: 'New York' }, tags: ['navy'] },
  ]

  it('suggests values of the Field path being typed, matching the prefix anywhere', () => {
    expect(suggestValues(records, 'name:da')).toEqual(['Ada'])
    expect(suggestValues(records, 'name:AL')).toEqual(['Alan'])
  })

  it('reads nested Field paths', () => {
    expect(suggestValues(records, 'address.city:lon')).toEqual(['London'])
  })

  it('suggests elements of array-valued fields', () => {
    expect(suggestValues(records, 'tags:m')).toEqual(['math'])
  })

  it('suggests every value for an empty prefix', () => {
    expect(suggestValues(records, 'name:')).toEqual(['Ada', 'Alan', 'Grace'])
  })

  it('returns no suggestions when no clause is being typed', () => {
    expect(suggestValues(records, '')).toEqual([])
    expect(suggestValues(records, 'name:ada AND ')).toEqual([])
  })

  it('returns no suggestions for a Field path absent from the Dataset', () => {
    expect(suggestValues(records, 'missing:x')).toEqual([])
  })
})
