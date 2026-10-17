import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { JsonRecord } from './parse-dataset'

vi.mock('./JsonEditor', () => ({
  default: (props: {
    ariaLabel: string
    value: string
    onChange: (value: string) => void
  }) => (
    <textarea
      aria-label={props.ariaLabel}
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    />
  ),
}))

vi.mock('ag-grid-react', () => ({
  AgGridReact: (props: {
    rowData?: JsonRecord[]
    onRowClicked?: (event: { data: JsonRecord }) => void
    onRowDoubleClicked?: (event: { data: JsonRecord }) => void
  }) => (
    <div data-testid="grid">
      {(props.rowData ?? []).map((row, index) => (
        <div
          key={index}
          data-testid={`row-${index}`}
          onClick={() => props.onRowClicked?.({ data: row })}
          onDoubleClick={() => props.onRowDoubleClicked?.({ data: row })}
        >
          {JSON.stringify(row)}
        </div>
      ))}
    </div>
  ),
}))

describe('App row interaction', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  async function loadSampleDataset(): Promise<void> {
    render(<App />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Load the sample dataset' }),
    )
    await screen.findByText('5 / 5')
  }

  it('only opens the Inspector on a double click', async () => {
    await loadSampleDataset()
    const row = screen.getByTestId('row-0')

    fireEvent.click(row)
    expect(
      screen.queryByRole('complementary', { name: 'Inspector' }),
    ).not.toBeInTheDocument()

    fireEvent.doubleClick(row)
    expect(
      screen.getByRole('complementary', { name: 'Inspector' }),
    ).toBeInTheDocument()
  })

  it('reads the double-clicked row in the Inspector', async () => {
    await loadSampleDataset()

    fireEvent.doubleClick(screen.getByTestId('row-0'))

    const record = screen.getByRole('region', { name: 'Record' })
    expect(record).toHaveTextContent('Ada Lovelace')
    expect(record).not.toHaveTextContent('Grace Hopper')
  })
})
