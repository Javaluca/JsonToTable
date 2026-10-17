import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

function suggestedValues(): (string | null)[] {
  return Array.from(
    document.querySelectorAll('#query-suggestions option'),
  ).map((option) => option.getAttribute('value'))
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads the sample Dataset and reports the number of Records', async () => {
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )

    expect(await screen.findByText('5 / 5')).toBeInTheDocument()
  })

  it('describes the minimal status label for assistive tech', async () => {
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )

    expect(
      await screen.findByLabelText('Matching 5 of 5 Records'),
    ).toBeInTheDocument()
  })

  it('does not filter until Enter is pressed', async () => {
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )
    await screen.findByText('5 / 5')

    await userEvent.type(screen.getByLabelText(/query dsl/i), 'name:grace')

    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(screen.getByText('5 / 5')).toBeInTheDocument()

    await userEvent.keyboard('{Enter}')

    expect(await screen.findByText('1 / 5')).toBeInTheDocument()
  })

  it('keeps the last valid Result Set and shows an error for a bad query', async () => {
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )
    await screen.findByText('5 / 5')

    await userEvent.type(screen.getByLabelText(/query dsl/i), 'name:')
    await userEvent.keyboard('{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incomplete query',
    )
    expect(screen.getByText('5 / 5')).toBeInTheDocument()
  })

  it('suggests values while writing a clause', async () => {
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )
    await screen.findByText('5 / 5')

    await userEvent.type(
      screen.getByLabelText(/query dsl/i),
      'address.city:lon',
    )

    expect(suggestedValues()).toEqual(['London'])
  })

  it('shows the input and table panels singularly or together', async () => {
    render(<App />)

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

    expect(screen.getByRole('separator')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Table' }))
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Input' }))
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })

  it('resizes the panels from the separator with the arrow keys', async () => {
    render(<App />)

    const separator = screen.getByRole('separator')
    expect(separator).toHaveAttribute('aria-valuenow', '360')

    separator.focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(separator).toHaveAttribute('aria-valuenow', '376')
  })

  it('recovers a previously loaded Dataset from the browser', async () => {
    const first = render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )
    await screen.findByText('5 / 5')
    first.unmount()

    render(<App />)

    const recent = await screen.findByRole('button', { name: /5 Records/i })
    await userEvent.click(recent)

    expect(await screen.findByText('5 / 5')).toBeInTheDocument()
  })
})
