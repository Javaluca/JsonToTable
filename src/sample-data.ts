import type { JsonRecord } from './parse-dataset'

export const SAMPLE_DATASET: JsonRecord[] = [
  {
    id: 1,
    name: 'Ada Lovelace',
    age: 36,
    tags: ['math', 'pioneer'],
    address: { city: 'London', country: 'UK' },
  },
  {
    id: 2,
    name: 'Grace Hopper',
    age: 85,
    tags: ['navy', 'compiler'],
    address: { city: 'New York', country: 'US' },
  },
  {
    id: 3,
    name: 'Alan Turing',
    age: 41,
    tags: ['math', 'crypto'],
    address: { city: 'London', country: 'UK' },
  },
  {
    id: 4,
    name: 'Edsger Dijkstra',
    age: 72,
    tags: ['algorithms'],
    address: { city: 'Nuenen', country: 'NL' },
  },
  {
    id: 5,
    name: 'Barbara Liskov',
    age: 86,
    tags: ['types', 'oop'],
    address: { city: 'Los Angeles', country: 'US' },
  },
]
