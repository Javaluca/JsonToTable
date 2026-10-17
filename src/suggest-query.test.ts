import { describe, expect, it } from 'vitest'
import type { JsonRecord } from './parse-dataset'
import { suggestQuery, type QuerySuggestion } from './suggest-query'

const RECORDS: JsonRecord[] = [
  { id: 1, name: 'Ada', age: 36, tags: ['math', 'engine'], address: { city: 'London' } },
  { id: 2, name: 'Grace', age: 45, tags: ['navy'], address: { city: 'New York' } },
  { id: 3, name: 'Alan', age: 41, tags: [], address: { city: 'London' } },
]

function suggest(text: string, caret: number = text.length): QuerySuggestion[] {
  return suggestQuery(RECORDS, text, caret)
}

function valuesOf(suggestions: QuerySuggestion[]): string[] {
  return suggestions.map((suggestion) => suggestion.value)
}

describe('suggestQuery', () => {
  it('suggests field paths for the token being written', () => {
    const suggestions = suggest('add')

    expect(valuesOf(suggestions)).toEqual(['address.city'])
    expect(suggestions[0].kind).toBe('field')
    expect(suggestions[0].replaceFrom).toBe(0)
    expect(suggestions[0].replaceTo).toBe(3)
  })

  it('suggests every field path for an empty query', () => {
    expect(valuesOf(suggest(''))).toEqual([
      'id',
      'name',
      'age',
      'tags',
      'address.city',
    ])
  })

  it('ranks field paths starting with the token first', () => {
    expect(valuesOf(suggest('a'))).toEqual(['age', 'address.city', 'name', 'tags'])
  })

  it('suggests values once a field is complete', () => {
    const suggestions = suggest('address.city:lon')

    expect(valuesOf(suggestions)).toEqual(['London'])
    expect(suggestions[0].kind).toBe('value')
    expect(suggestions[0].replaceFrom).toBe(13)
    expect(suggestions[0].replaceTo).toBe(16)
  })

  it('suggests distinct values in Dataset order for an empty partial', () => {
    expect(valuesOf(suggest('address.city:'))).toEqual(['London', '"New York"'])
  })

  it('expands array values', () => {
    expect(valuesOf(suggest('tags:'))).toEqual(['math', 'engine', 'navy'])
  })

  it('quotes values that the Query DSL would otherwise misread', () => {
    expect(valuesOf(suggest('address.city:new'))).toEqual(['"New York"'])
  })

  it('suggests values after a comparison operator', () => {
    const suggestions = suggest('age:>4')

    expect(valuesOf(suggestions)).toEqual(['45', '41'])
    expect(suggestions[0].replaceFrom).toBe(5)
  })

  it('replaces the opening quote of an unterminated quoted value', () => {
    const suggestions = suggestQuery([{ name: 'Ada Lovelace' }], 'name:"Ada Lov', 13)

    expect(valuesOf(suggestions)).toEqual(['"Ada Lovelace"'])
    expect(suggestions[0].replaceFrom).toBe(5)
    expect(suggestions[0].replaceTo).toBe(13)
  })

  it('returns nothing when a quoted value matches no Record', () => {
    expect(suggest('name:"Ada Lov')).toEqual([])
  })

  it('returns nothing for an unknown field', () => {
    expect(suggest('nope:')).toEqual([])
  })

  it('reads the clause at the caret, not at the end of the query', () => {
    const text = 'name:gra AND age:41'

    expect(valuesOf(suggestQuery(RECORDS, text, 8))).toEqual(['Grace'])
    expect(valuesOf(suggestQuery(RECORDS, text, text.length))).toEqual(['41'])
  })

  it('caps suggestions at twenty', () => {
    const records: JsonRecord[] = Array.from({ length: 40 }, (_, index) => ({
      code: `c${index}`,
    }))

    expect(suggestQuery(records, 'code:c', 6)).toHaveLength(20)
  })
})
