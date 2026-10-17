export const DATASET_PALETTE = [
  '#2563eb',
  '#0d9488',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#16a34a',
  '#0891b2',
  '#ca8a04',
  '#dc2626',
  '#4f46e5',
]

export const SAMPLE_COLOR = '#e11d48'

export function colorForIndex(index: number): string {
  return DATASET_PALETTE[index % DATASET_PALETTE.length]
}
