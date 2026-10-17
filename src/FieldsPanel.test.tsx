import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import FieldsPanel from './FieldsPanel'

const COLUMNS = [
  { field: 'id', sample: '1', numeric: true },
  { field: 'address.city', sample: 'London', numeric: false },
]

describe('FieldsPanel', () => {
  it('lists every Field path with a sample value', () => {
    render(<FieldsPanel columns={COLUMNS} onPick={() => {}} />)

    expect(screen.getByText('id')).toBeInTheDocument()
    expect(screen.getByText('address.city')).toBeInTheDocument()
    expect(screen.getByText('London')).toBeInTheDocument()
  })

  it('starts a clause for the Field that was picked', async () => {
    const onPick = vi.fn()
    render(<FieldsPanel columns={COLUMNS} onPick={onPick} />)

    await userEvent.click(screen.getByRole('button', { name: 'Ask about id' }))

    expect(onPick).toHaveBeenCalledWith('id:')
  })

  it('explains itself while there is no Dataset', () => {
    render(<FieldsPanel columns={[]} onPick={() => {}} />)

    expect(
      screen.getByText(/load a dataset and every field path/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('FieldsPanel inside its tile', () => {
  it('reports how many Field paths it holds', () => {
    render(<FieldsPanel columns={COLUMNS} onPick={() => {}} />)

    const tile = screen.getByRole('region', { name: 'Fields' })
    expect(within(tile).getByText('2')).toBeInTheDocument()
  })
})
