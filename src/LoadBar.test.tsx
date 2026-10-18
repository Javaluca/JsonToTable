import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LoadBar from './LoadBar'

describe('LoadBar', () => {
  it('shows how far along a measurable load is', () => {
    render(<LoadBar label="Checking Record 3 of 4" value={0.75} />)

    const bar = screen.getByRole('progressbar', {
      name: 'Checking Record 3 of 4',
    })
    expect(bar).toHaveAttribute('aria-valuenow', '75')
    expect(bar).toHaveAttribute('data-indeterminate', 'false')
    expect(bar.firstElementChild).toHaveStyle({ transform: 'scaleX(0.75)' })
  })

  it('drops the reading when a load cannot measure itself', () => {
    render(<LoadBar label="Parsing JSON" value={null} />)

    const bar = screen.getByRole('progressbar', { name: 'Parsing JSON' })
    expect(bar).not.toHaveAttribute('aria-valuenow')
    expect(bar).toHaveAttribute('data-indeterminate', 'true')
    expect(bar.firstElementChild?.getAttribute('style')).toBeNull()
  })
})
