import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('loads the sample Dataset and reports the number of Records', async () => {
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )

    expect(await screen.findByText('5 / 5')).toBeInTheDocument()
  })

  it('filters Records with the Query DSL', async () => {
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )
    await screen.findByText('5 / 5')

    await userEvent.type(screen.getByLabelText(/query dsl/i), 'name:grace')

    expect(await screen.findByText('1 / 5')).toBeInTheDocument()
  })

  it('keeps the last valid Result Set and shows an error for a bad query', async () => {
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )
    await screen.findByText('5 / 5')

    await userEvent.type(screen.getByLabelText(/query dsl/i), 'name:')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incomplete query',
    )
    expect(screen.getByText('5 / 5')).toBeInTheDocument()
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

  it('shows the input and table panels singularly or together', async () => {
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )
    await screen.findByText('5 / 5')

    await userEvent.click(screen.getByRole('button', { name: 'Table' }))
    expect(
      screen.queryByLabelText(/paste a json array/i),
    ).not.toBeInTheDocument()
    expect(screen.getByText('5 / 5')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Input' }))
    expect(
      screen.queryByLabelText(/paste a json array/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /load sample data/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText('5 / 5')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Both' }))
    expect(
      screen.queryByLabelText(/paste a json array/i),
    ).toBeInTheDocument()
    expect(screen.getByText('5 / 5')).toBeInTheDocument()
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
})
