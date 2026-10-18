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

function queryInput(): HTMLInputElement {
  return screen.getByLabelText('Query')
}

function suggestionNames(): string[] {
  return within(screen.getByRole('listbox', { name: 'Query suggestions' }))
    .getAllByRole('option')
    .map((option) => option.getAttribute('aria-label') ?? '')
}

async function loadSampleDataset(): Promise<void> {
  await userEvent.click(
    screen.getByRole('button', { name: 'Load the sample dataset' }),
  )
  await screen.findByText('5 / 5')
}

async function openEditorFromLanding(): Promise<void> {
  await userEvent.click(screen.getByLabelText('Paste JSON'))
}

async function pasteDataset(text: string): Promise<void> {
  const opener = screen.queryByRole('button', { name: 'New dataset' })
  if (opener !== null) {
    await userEvent.click(opener)
  } else {
    await openEditorFromLanding()
  }
  fireEvent.change(screen.getByLabelText('Dataset JSON'), {
    target: { value: text },
  })
  await userEvent.click(screen.getByRole('button', { name: 'Load' }))
}

async function openDatasetMenu(): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole('button', { name: /^Active Dataset:/ }))
  return screen.getByRole('listbox', { name: 'Datasets' })
}

async function typeQuery(text: string): Promise<void> {
  await userEvent.type(queryInput(), text)
  await userEvent.keyboard('{Escape}')
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('shows a landing hero with a call to action before any Dataset is loaded', () => {
    render(<App />)

    expect(screen.getByLabelText('Paste JSON')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Upload a JSON or NDJSON file'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Load the sample dataset' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Query')).not.toBeInTheDocument()
  })

  it('opens the full-screen editor when the landing paste box is clicked', async () => {
    render(<App />)

    await openEditorFromLanding()

    expect(screen.getByLabelText('Dataset JSON')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument()
  })

  it('loads a Dataset dropped onto the landing dropzone', async () => {
    render(<App />)

    const file = new File(['[{"id":1},{"id":2}]'], 'data.json', {
      type: 'application/json',
    })
    fireEvent.drop(
      screen.getByRole('group', { name: 'Upload or drop a file' }),
      { dataTransfer: { files: [file] } },
    )

    expect(await screen.findByText('2 / 2')).toBeInTheDocument()
  })

  it('toggles the Input, Table and Inspector blocks', async () => {
    render(<App />)

    await loadSampleDataset()

    expect(
      screen.queryByRole('complementary', { name: 'Inspector' }),
    ).not.toBeInTheDocument()

    expect(screen.getByRole('region', { name: 'Input' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Input' }))
    expect(
      screen.queryByRole('region', { name: 'Input' }),
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Inspector' }))
    expect(
      screen.getByRole('complementary', { name: 'Inspector' }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Table' }))
    expect(
      screen.queryByRole('region', { name: 'Result Set' }),
    ).not.toBeInTheDocument()
  })

  it('always keeps at least one view visible', async () => {
    render(<App />)

    await loadSampleDataset()

    await userEvent.click(screen.getByRole('button', { name: 'Inspector' }))
    await userEvent.click(screen.getByRole('button', { name: 'Input' }))
    await userEvent.click(screen.getByRole('button', { name: 'Table' }))

    expect(screen.getByRole('button', { name: 'Inspector' })).toBeDisabled()
    expect(
      screen.getByRole('complementary', { name: 'Inspector' }),
    ).toBeInTheDocument()
  })

  it('resizes a block from its drag handle', async () => {
    render(<App />)

    await loadSampleDataset()

    const panel = screen.getByRole('region', { name: 'Input' })
    const before = panel.getAttribute('style')
    fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize Input' }), {
      key: 'ArrowRight',
    })

    expect(panel.getAttribute('style')).not.toBe(before)
  })

  it('applies edits from the Input block to the active Dataset', async () => {
    render(<App />)

    await loadSampleDataset()
    fireEvent.change(screen.getByLabelText('Dataset source'), {
      target: { value: '[{"id":1}]' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(await screen.findByText('1 / 1')).toBeInTheDocument()
  })

  it('offers Apply, at the foot of the Input block, only while there are edits', async () => {
    render(<App />)

    await loadSampleDataset()
    expect(
      screen.queryByRole('button', { name: 'Apply' }),
    ).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Dataset source'), {
      target: { value: '[{"id":1}]' },
    })

    const apply = screen.getByRole('button', { name: 'Apply' })
    expect(apply.closest('.panel-foot')).not.toBeNull()
    expect(
      within(screen.getByRole('region', { name: 'Input' })).getByText(
        'Press Ctrl+Enter to apply',
      ),
    ).toBeInTheDocument()

    await userEvent.click(apply)
    expect(await screen.findByText('1 / 1')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Apply' }),
    ).not.toBeInTheDocument()
  })

  it('loads the sample Dataset from the landing hero', async () => {
    render(<App />)

    await loadSampleDataset()

    expect(screen.getByText('5 / 5')).toBeInTheDocument()
  })

  it('describes the minimal status label for assistive tech', async () => {
    render(<App />)

    await loadSampleDataset()

    expect(screen.getByLabelText('Matching 5 of 5 Records')).toBeInTheDocument()
  })

  it('keeps the Result Set status in the bottom bar', async () => {
    render(<App />)

    await loadSampleDataset()

    const status = screen.getByLabelText('Matching 5 of 5 Records')
    expect(status.closest('.statusbar')).not.toBeNull()
    expect(status.closest('.toolbar')).toBeNull()
  })

  it('loads a pasted Dataset from the full-screen editor', async () => {
    render(<App />)

    await pasteDataset('[{"id":1},{"id":2}]')

    expect(await screen.findByText('2 / 2')).toBeInTheDocument()
  })

  it('reports a parse error inside the full-screen editor', async () => {
    render(<App />)

    await openEditorFromLanding()
    fireEvent.change(screen.getByLabelText('Dataset JSON'), {
      target: { value: '{ not json' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Load' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid JSON on line 1',
    )
    expect(screen.queryByLabelText('Query')).not.toBeInTheDocument()
  })

  it('does not filter until Enter is pressed', async () => {
    render(<App />)

    await loadSampleDataset()
    await typeQuery('name:grace')

    expect(screen.getByText('5 / 5')).toBeInTheDocument()

    await userEvent.keyboard('{Enter}')

    expect(await screen.findByText('1 / 5')).toBeInTheDocument()
  })

  it('shows an error for an incomplete query', async () => {
    render(<App />)

    await loadSampleDataset()
    await typeQuery('name:')
    await userEvent.keyboard('{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent('Incomplete query')
    expect(screen.getByText('5 / 5')).toBeInTheDocument()
  })

  it('suggests Field paths while writing a field name', async () => {
    render(<App />)

    await loadSampleDataset()
    await userEvent.type(queryInput(), 'add')

    expect(suggestionNames()).toEqual(['address.city', 'address.country'])
  })

  it('suggests values for the field being written and inserts the choice', async () => {
    render(<App />)

    await loadSampleDataset()
    await userEvent.type(queryInput(), 'address.city:lon')

    await userEvent.click(
      within(screen.getByRole('listbox', { name: 'Query suggestions' })).getByRole(
        'option',
        { name: 'London' },
      ),
    )

    expect(queryInput()).toHaveValue('address.city:London')
    expect(
      screen.queryByRole('listbox', { name: 'Query suggestions' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('5 / 5')).toBeInTheDocument()
  })

  it('completes a value from the keyboard without running the query', async () => {
    render(<App />)

    await loadSampleDataset()
    await userEvent.type(queryInput(), 'name:gr')

    await userEvent.keyboard('{Enter}')

    expect(queryInput()).toHaveValue('name:"Grace Hopper"')
    expect(screen.getByText('5 / 5')).toBeInTheDocument()

    await userEvent.keyboard('{Enter}')

    expect(await screen.findByText('1 / 5')).toBeInTheDocument()
  })

  it('walks the suggestions with the arrow keys', async () => {
    render(<App />)

    await loadSampleDataset()
    await userEvent.type(queryInput(), 'address.city:')

    expect(suggestionNames().slice(0, 2)).toEqual(['London', '"New York"'])

    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')

    expect(queryInput()).toHaveValue('address.city:"New York"')
  })

  it('clears the query from the inline clear button', async () => {
    render(<App />)

    await loadSampleDataset()
    await typeQuery('name:grace')
    await userEvent.keyboard('{Enter}')
    await screen.findByText('1 / 5')

    await userEvent.click(screen.getByRole('button', { name: 'Clear query' }))

    expect(queryInput()).toHaveValue('')
    expect(screen.getByText('5 / 5')).toBeInTheDocument()
  })

  it('starts a clause from a Field path in the Fields panel', async () => {
    render(<App />)

    await loadSampleDataset()
    await userEvent.click(screen.getByRole('button', { name: 'Fields' }))
    await userEvent.click(screen.getByRole('button', { name: 'Ask about age' }))

    expect(queryInput()).toHaveValue('age:')
    expect(queryInput()).toHaveFocus()
  })

  it('copies the Result Set as JSON for the current Query', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    render(<App />)

    await loadSampleDataset()
    await typeQuery('name:grace')
    await userEvent.keyboard('{Enter}')
    await screen.findByText('1 / 5')

    await userEvent.click(screen.getByRole('button', { name: /Actions/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Copy JSON' }))

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('"Grace Hopper"'),
    )
    expect(writeText.mock.calls[0][0]).not.toContain('Ada Lovelace')
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument()
  })

  it('downloads the Result Set as a stamped JSON file', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:result')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    render(<App />)

    await loadSampleDataset()
    await userEvent.click(screen.getByRole('button', { name: /Actions/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Download JSON' }))

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()

    createObjectURL.mockRestore()
    click.mockRestore()
  })

  it('keeps several Datasets and switches between them from the menu', async () => {
    render(<App />)

    await loadSampleDataset()
    await pasteDataset('[{"id":1},{"id":2}]')
    await screen.findByText('2 / 2')

    const list = await openDatasetMenu()
    await userEvent.click(
      within(list).getByRole('option', { name: /5 Records/ }),
    )

    expect(await screen.findByText('5 / 5')).toBeInTheDocument()
  })

  it('offers the sample dataset until it is loaded, then drops the duplicate', async () => {
    render(<App />)

    await pasteDataset('[{"id":1},{"id":2}]')
    await screen.findByText('2 / 2')

    let list = await openDatasetMenu()
    expect(within(list).getAllByRole('option')).toHaveLength(2)
    await userEvent.click(
      within(list).getByRole('option', { name: 'Sample dataset' }),
    )
    await screen.findByText('5 / 5')

    list = await openDatasetMenu()
    expect(within(list).getAllByRole('option')).toHaveLength(2)
    expect(
      within(list).queryByRole('option', { name: 'Sample dataset' }),
    ).not.toBeInTheDocument()
  })

  it('remembers the Query of each Dataset', async () => {
    render(<App />)

    await loadSampleDataset()
    await typeQuery('name:grace')
    await userEvent.keyboard('{Enter}')
    await screen.findByText('1 / 5')

    await pasteDataset('[{"id":1},{"id":2}]')
    await screen.findByText('2 / 2')
    expect(queryInput()).toHaveValue('')

    const list = await openDatasetMenu()
    await userEvent.click(
      within(list).getByRole('option', { name: /5 Records/ }),
    )

    expect(await screen.findByText('1 / 5')).toBeInTheDocument()
    expect(queryInput()).toHaveValue('name:grace')
  })

  it('restores the most recent Dataset when the app is reopened', async () => {
    const first = render(<App />)
    await loadSampleDataset()
    first.unmount()

    render(<App />)

    expect(await screen.findByText('5 / 5')).toBeInTheDocument()
  })

  it('loads the sample Dataset from the dataset=sample URL', async () => {
    window.history.replaceState({}, '', '/?dataset=sample')

    render(<App />)

    expect(await screen.findByText('5 / 5')).toBeInTheDocument()
  })

  it('names a Dataset typed in the full-screen editor', async () => {
    render(<App />)

    await openEditorFromLanding()
    fireEvent.change(screen.getByLabelText('Dataset name'), {
      target: { value: 'People' },
    })
    fireEvent.change(screen.getByLabelText('Dataset JSON'), {
      target: { value: '[{"id":1},{"id":2}]' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Load' }))
    await screen.findByText('2 / 2')

    const list = await openDatasetMenu()
    expect(
      within(list).getByRole('option', { name: /People/ }),
    ).toBeInTheDocument()
  })

  it('renames a loaded Dataset from the menu', async () => {
    render(<App />)

    await pasteDataset('[{"id":1},{"id":2}]')
    await screen.findByText('2 / 2')

    const list = await openDatasetMenu()
    await userEvent.click(
      within(list).getByRole('button', { name: /Rename 2 Records/ }),
    )
    const field = within(list).getByLabelText(/Rename 2 Records/)
    await userEvent.clear(field)
    await userEvent.type(field, 'People{Enter}')

    expect(
      within(screen.getByRole('listbox', { name: 'Datasets' })).getByRole(
        'option',
        { name: 'People · 2 Records' },
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Active Dataset: People · 2 Records' }),
    ).toBeInTheDocument()
  })

  it('reverts a Dataset name to the derived label when renamed to blank', async () => {
    render(<App />)

    await pasteDataset('[{"id":1,"name":"Ada"}]')
    await screen.findByText('1 / 1')

    const list = await openDatasetMenu()
    await userEvent.click(
      within(list).getByRole('button', { name: /Rename 1 Record/ }),
    )
    const field = within(list).getByLabelText(/Rename 1 Record/)
    await userEvent.type(field, 'People')
    await userEvent.tab()

    expect(
      within(screen.getByRole('listbox', { name: 'Datasets' })).getByRole(
        'option',
        { name: 'People · 1 Record' },
      ),
    ).toBeInTheDocument()

    await userEvent.click(
      within(screen.getByRole('listbox', { name: 'Datasets' })).getByRole(
        'button',
        { name: 'Rename People · 1 Record' },
      ),
    )
    const again = screen.getByLabelText('Rename People · 1 Record')
    await userEvent.clear(again)
    await userEvent.tab()

    expect(
      within(screen.getByRole('listbox', { name: 'Datasets' })).getByRole(
        'option',
        { name: '1 Record · Ada' },
      ),
    ).toBeInTheDocument()
  })

  it('removes a Dataset from the menu', async () => {
    render(<App />)

    await loadSampleDataset()
    await pasteDataset('[{"id":1},{"id":2}]')
    await screen.findByText('2 / 2')

    const list = await openDatasetMenu()
    await userEvent.click(
      within(list).getByRole('button', { name: /Remove 5 Records/ }),
    )

    const updated = screen.getByRole('listbox', { name: 'Datasets' })
    expect(
      within(updated).queryByRole('option', { name: /5 Records/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('switches to another Dataset when the active one is removed', async () => {
    render(<App />)

    await loadSampleDataset()
    await pasteDataset('[{"id":1},{"id":2}]')
    await screen.findByText('2 / 2')

    const list = await openDatasetMenu()
    await userEvent.click(
      within(list).getByRole('button', { name: /Remove 2 Records/ }),
    )

    expect(await screen.findByText('5 / 5')).toBeInTheDocument()
  })

  it('returns to the landing hero when the last Dataset is removed', async () => {
    render(<App />)

    await pasteDataset('[{"id":1},{"id":2}]')
    await screen.findByText('2 / 2')

    const list = await openDatasetMenu()
    await userEvent.click(
      within(list).getByRole('button', { name: /Remove 2 Records/ }),
    )

    expect(
      await screen.findByRole('button', { name: 'Load the sample dataset' }),
    ).toBeInTheDocument()
  })
})
