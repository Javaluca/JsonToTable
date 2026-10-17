import { describe, expect, it } from 'vitest'
import type { JsonRecord } from './parse-dataset'
import { downloadName, toJsonText } from './serialize'

const RECORDS: JsonRecord[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
]

describe('toJsonText', () => {
  it('pretty-prints a Result Set as a JSON array', () => {
    expect(toJsonText(RECORDS)).toBe(
      '[\n  {\n    "id": 1,\n    "name": "Ada"\n  },\n  {\n    "id": 2,\n    "name": "Grace"\n  }\n]',
    )
  })

  it('renders an empty Result Set as an empty array', () => {
    expect(toJsonText([])).toBe('[]')
  })
})

describe('downloadName', () => {
  it('stamps the file name', () => {
    const name = downloadName(new Date('2026-10-17T09:30:00Z'))

    expect(name).toBe('result-set-2026-10-17-09-30-00.json')
  })
})
