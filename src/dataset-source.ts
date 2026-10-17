import { parseDataset, type ParseResult } from './parse-dataset'

export type DatasetSource = {
  parse: (text: string) => Promise<ParseResult>
  cancel: () => void
}

export function createDatasetSource(): DatasetSource {
  let worker: Worker | null = null

  return {
    parse(text) {
      if (typeof Worker === 'undefined') {
        return Promise.resolve(parseDataset(text))
      }
      worker?.terminate()
      return new Promise<ParseResult>((resolve) => {
        const active = new Worker(new URL('./parse.worker.ts', import.meta.url), {
          type: 'module',
        })
        worker = active
        active.onmessage = (event: MessageEvent<ParseResult>) => {
          active.terminate()
          if (worker === active) worker = null
          resolve(event.data)
        }
        active.onerror = () => {
          active.terminate()
          if (worker === active) worker = null
          resolve({ ok: false, error: 'Parsing failed unexpectedly' })
        }
        active.postMessage({ text })
      })
    },
    cancel() {
      worker?.terminate()
      worker = null
    },
  }
}
