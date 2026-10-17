import { describe, expect, it } from 'vitest'
import { clauseFor, quoteClauseValue, refineQuery } from './query-clause'

describe('quoteClauseValue', () => {
  it('leaves a bare word untouched', () => {
    expect(quoteClauseValue('London')).toBe('London')
  })

  it('quotes a value containing whitespace', () => {
    expect(quoteClauseValue('Grace Hopper')).toBe('"Grace Hopper"')
  })

  it('quotes a value containing DSL punctuation', () => {
    expect(quoteClauseValue('a:b')).toBe('"a:b"')
    expect(quoteClauseValue('a>=b')).toBe('"a>=b"')
    expect(quoteClauseValue('say "hi"')).toBe('"say "hi""')
  })
})

describe('clauseFor', () => {
  it('builds a clause for a bare string', () => {
    expect(clauseFor('address.city', 'London')).toBe('address.city:London')
  })

  it('quotes a string that needs it', () => {
    expect(clauseFor('name', 'Grace Hopper')).toBe('name:"Grace Hopper"')
  })

  it('builds a clause for numbers and booleans', () => {
    expect(clauseFor('age', 36)).toBe('age:36')
    expect(clauseFor('active', true)).toBe('active:true')
  })

  it('refuses values with no honest clause', () => {
    expect(clauseFor('x', null)).toBeNull()
    expect(clauseFor('x', undefined)).toBeNull()
    expect(clauseFor('x', '')).toBeNull()
    expect(clauseFor('x', ['a'])).toBeNull()
    expect(clauseFor('x', { a: 1 })).toBeNull()
  })
})

describe('refineQuery', () => {
  it('stands alone when the Query is empty', () => {
    expect(refineQuery('', 'name:Ada')).toBe('name:Ada')
    expect(refineQuery('   ', 'name:Ada')).toBe('name:Ada')
  })

  it('keeps the earlier Query when narrowing', () => {
    expect(refineQuery('age:>40', 'address.city:London')).toBe(
      '(age:>40) AND address.city:London',
    )
  })

  it('nests when narrowed twice', () => {
    expect(refineQuery('(age:>40) AND tags:navy', 'tags:compiler')).toBe(
      '((age:>40) AND tags:navy) AND tags:compiler',
    )
  })
})
