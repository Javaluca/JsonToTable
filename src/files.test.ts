import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText, downloadText } from './files'

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
}

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: undefined,
  })
})

describe('copyText', () => {
  it('reports success when the clipboard accepts the text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)

    await expect(copyText('[{"id":1}]')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('[{"id":1}]')
  })

  it('reports failure when the clipboard rejects', async () => {
    stubClipboard(() => Promise.reject(new Error('denied')))

    await expect(copyText('x')).resolves.toBe(false)
  })

  it('reports failure when the browser has no clipboard', async () => {
    await expect(copyText('x')).resolves.toBe(false)
  })
})

describe('downloadText', () => {
  it('hands the text to a stamped download and cleans the URL up', () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:result')
    const revokeObjectURL = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {})
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    expect(downloadText('[]', 'result-set.json')).toBe(true)
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:result')

    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
    click.mockRestore()
  })

  it('reports failure when the browser cannot make object URLs', () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => {
        throw new Error('no object URLs here')
      })

    expect(downloadText('[]', 'result-set.json')).toBe(false)

    createObjectURL.mockRestore()
  })
})
