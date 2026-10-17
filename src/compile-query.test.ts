import { describe, expect, it } from 'vitest'
import { compileQuery } from './compile-query'

describe('compileQuery', () => {
  it('matches Records whose field value contains the term, case-insensitively', () => {
    const query = compileQuery('name:ada')
    expect(query.ok).toBe(true)
    if (!query.ok) return
    expect(query.test({ name: 'Ada Lovelace' })).toBe(true)
    expect(query.test({ name: 'Grace Hopper' })).toBe(false)
  })

  it('matches every Record for a blank query', () => {
    const query = compileQuery('   ')
    expect(query.ok).toBe(true)
    if (!query.ok) return
    expect(query.test({ id: 1 })).toBe(true)
  })

  it('supports != as negation', () => {
    const query = compileQuery('name:!=ada')
    expect(query.ok).toBe(true)
    if (!query.ok) return
    expect(query.test({ name: 'Grace Hopper' })).toBe(true)
    expect(query.test({ name: 'Ada Lovelace' })).toBe(false)
  })

  it('matches when any element of an array-valued field matches', () => {
    const query = compileQuery('tags:ci')
    expect(query.ok).toBe(true)
    if (!query.ok) return
    expect(query.test({ tags: ['audit', 'ci'] })).toBe(true)
    expect(query.test({ tags: ['audit'] })).toBe(false)
  })

  it('never matches a Record missing the Field path', () => {
    const query = compileQuery('user.name:ada')
    expect(query.ok).toBe(true)
    if (!query.ok) return
    expect(query.test({})).toBe(false)
    expect(query.test({ user: {} })).toBe(false)
  })

  it('supports boolean logic, parentheses and numeric comparison', () => {
    const query = compileQuery('(name:ada OR name:grace) AND age:>30')
    expect(query.ok).toBe(true)
    if (!query.ok) return
    expect(query.test({ name: 'Ada', age: 36 })).toBe(true)
    expect(query.test({ name: 'Grace', age: 20 })).toBe(false)
    expect(query.test({ name: 'Alan', age: 41 })).toBe(false)
  })

  it('reports an error for an unparseable query', () => {
    const query = compileQuery('name:')
    expect(query.ok).toBe(false)
  })
})
