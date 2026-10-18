import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { JsonRecord } from './parse-dataset'
import RecordPanel from './RecordPanel'

const RECORD: JsonRecord = {
  id: 2,
  name: 'Grace Hopper',
  tags: ['navy', 'compiler'],
  nickname: null,
  address: { city: 'New York' },
}

function renderPanel(overrides: Partial<Parameters<typeof RecordPanel>[0]> = {}) {
  const props = {
    record: RECORD,
    inResultSet: true,
    onNarrow: vi.fn(),
    onCopy: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
  render(<RecordPanel {...props} />)
  return props
}

describe('RecordPanel', () => {
  it('reads out every Field path and value of the Record', () => {
    renderPanel()

    expect(screen.getByText('address.city')).toBeInTheDocument()
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    expect(screen.getByText('nickname')).toBeInTheDocument()
    expect(screen.getByText('null')).toBeInTheDocument()
  })

  it('narrows the Query when a value is picked', async () => {
    const { onNarrow } = renderPanel()

    await userEvent.click(
      screen.getByRole('button', { name: 'Narrow to name:"Grace Hopper"' }),
    )

    expect(onNarrow).toHaveBeenCalledWith('name:"Grace Hopper"')
  })

  it('offers one chip per element of an array', async () => {
    const { onNarrow } = renderPanel()

    await userEvent.click(
      screen.getByRole('button', { name: 'Narrow to tags:compiler' }),
    )

    expect(onNarrow).toHaveBeenCalledWith('tags:compiler')
  })

  it('copies the Record as JSON and says so', async () => {
    const onCopy = vi.fn().mockResolvedValue(true)
    renderPanel({ onCopy })

    await userEvent.click(screen.getByRole('button', { name: 'Copy JSON' }))

    expect(onCopy).toHaveBeenCalledWith(
      expect.stringContaining('"name": "Grace Hopper"'),
    )
    expect(onCopy.mock.calls[0][0].trimStart().startsWith('{')).toBe(true)
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('keeps only the object area, with the copy button in the head', () => {
    renderPanel()

    const tile = screen.getByRole('region', { name: 'Record' })
    const copy = screen.getByRole('button', { name: 'Copy JSON' })

    expect(tile.querySelector('.record-raw')).toBeNull()
    expect(copy.closest('.panel-head')).not.toBeNull()
    expect(screen.queryByText('filtered out')).not.toBeInTheDocument()
  })

  it('stays quiet when the clipboard refuses', async () => {
    renderPanel({ onCopy: vi.fn().mockResolvedValue(false) })

    await userEvent.click(screen.getByRole('button', { name: 'Copy JSON' }))

    expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument()
  })

  it('marks a Record that the Result Set no longer holds', () => {
    renderPanel({ inResultSet: false })

    const tile = screen.getByRole('region', { name: 'Record' })
    expect(within(tile).getByText('filtered out')).toBeInTheDocument()
  })

  it('asks for a row while nothing is picked', () => {
    renderPanel({ record: null })

    expect(
      screen.getByText(/pick a row in the table to read every value/i),
    ).toBeInTheDocument()
  })
})
