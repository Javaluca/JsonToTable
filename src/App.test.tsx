import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

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

function suggestedValues(): (string | null)[] {
  return Array.from(
    document.querySelectorAll('#query-suggestions option'),
  ).map((option) => option.getAttribute('value'))
}

async function loadSampleDataset(): Promise<void> {
  await userEvent.click(
    screen.getByRole('button', { name: /load sample data/i }),
  )
  await screen.findByText('5 / 5')
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads the sample Dataset and reports the number of Records', async () => {
    render(<App />)

    await loadSampleDataset()

    expect(screen.getByText('5 / 5')).toBeInTheDocument()
  })

  it('describes the minimal status label for assistive tech', async () => {
    render(<App />)

    await loadSampleDataset()

    expect(
      screen.getByLabelText('Matching 5 of 5 Records'),
    ).toBeInTheDocument()
  })

  it('holds the user in the input panel until a Dataset is loaded', async () => {
    render(<App />)

    expect(screen.getByRole('button', { name: 'Table' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Both' })).toBeDisabled()
    expect(screen.getByLabelText(/paste a json array/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/query dsl/i)).not.toBeInTheDocument()

    await loadSampleDataset()

    expect(screen.getByRole('button', { name: 'Table' })).toBeEnabled()
    expect(screen.getByLabelText(/query dsl/i)).toBeInTheDocument()
  })

  it('does not filter until Enter is pressed', async () => {
    render(<App />)

    await loadSampleDataset()

    await userEvent.type(screen.getByLabelText(/query dsl/i), 'name:grace')

    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(screen.getByText('5 / 5')).toBeInTheDocument()

    await userEvent.keyboard('{Enter}')

    expect(await screen.findByText('1 / 5')).toBeInTheDocument()
  })

  it('keeps the last valid Result Set and shows an error for a bad query', async () => {
    render(<App />)

    await loadSampleDataset()

    await userEvent.type(screen.getByLabelText(/query dsl/i), 'name:')
    await userEvent.keyboard('{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incomplete query',
    )
    expect(screen.getByText('5 / 5')).toBeInTheDocument()
  })

  it('suggests values while writing a clause', async () => {
    render(<App />)

    await loadSampleDataset()

    await userEvent.type(
      screen.getByLabelText(/query dsl/i),
      'address.city:lon',
    )

    expect(suggestedValues()).toEqual(['London'])
  })

  it('keeps several Datasets and switches between them from the picker', async () => {
    render(<App />)

    await loadSampleDataset()

    fireEvent.change(screen.getByLabelText(/paste a json array/i), {
      target: { value: '[{"id":1},{"id":2}]' },
    })
    await userEvent.click(screen.getByRole('button', { name: /load json/i }))
    await screen.findByText('2 / 2')

    const picker = screen.getByLabelText(/active dataset/i)
    expect(within(picker).getAllByRole('option')).toHaveLength(2)
    expect(picker).toHaveValue(
      within(picker).getByRole('option', { name: /2 Records/ }).getAttribute('value'),
    )

    await userEvent.selectOptions(
      picker,
      within(picker).getByRole('option', { name: /5 Records/ }),
    )

    expect(await screen.findByText('5 / 5')).toBeInTheDocument()
  })

  it('restores the most recent Dataset when the app is reopened', async () => {
    const first = render(<App />)
    await loadSampleDataset()
    first.unmount()

    render(<App />)

    expect(await screen.findByText('5 / 5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Table' })).toBeEnabled()
  })

  it('shows the input and table panels singularly or together', async () => {
    render(<App />)

    await loadSampleDataset()

    expect(screen.getByLabelText(/paste a json array/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/query dsl/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Table' }))
    expect(
      screen.queryByLabelText(/paste a json array/i),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText(/query dsl/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Input' }))
    expect(screen.getByLabelText(/paste a json array/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/query dsl/i)).not.toBeInTheDocument()
  })

  it('offers the draggable separator only in the Both view', async () => {
    render(<App />)

    await loadSampleDataset()

    expect(screen.getByRole('separator')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Table' }))
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Input' }))
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })

  it('resizes the panels from the separator with the arrow keys', async () => {
    render(<App />)

    await loadSampleDataset()

    const separator = screen.getByRole('separator')
    expect(separator).toHaveAttribute('aria-valuenow', '360')

    separator.focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(separator).toHaveAttribute('aria-valuenow', '376')
  })
})
