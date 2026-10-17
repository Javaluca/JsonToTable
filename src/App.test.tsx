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

    expect(
      await screen.findByText('Matching 5 of 5 Records'),
    ).toBeInTheDocument()
  })

  it('filters Records with the Query DSL', async () => {
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )
    await screen.findByText('Matching 5 of 5 Records')

    await userEvent.type(screen.getByLabelText(/query dsl/i), 'name:grace')

    expect(
      await screen.findByText('Matching 1 of 5 Records'),
    ).toBeInTheDocument()
  })

  it('keeps the last valid Result Set and shows an error for a bad query', async () => {
    render(<App />)

    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    )
    await screen.findByText('Matching 5 of 5 Records')

    await userEvent.type(screen.getByLabelText(/query dsl/i), 'name:')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incomplete query',
    )
    expect(screen.getByText('Matching 5 of 5 Records')).toBeInTheDocument()
  })
})
