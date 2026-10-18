import {
  parseDataset,
  type ParseProgressSink,
  type ParseResult,
} from './parse-dataset'
import type { WorkerReply } from './parse.worker'

export type DatasetSource = {
  parse: (
    text: string,
    onProgress?: ParseProgressSink,
  ) => Promise<ParseResult>
  cancel: () => void
}

export function createDatasetSource(): DatasetSource {
  let worker: Worker | null = null

  return {
    parse(text, onProgress) {
      if (typeof Worker === 'undefined') {
        return Promise.resolve(parseDataset(text, onProgress))
      }
      worker?.terminate()
      return new Promise<ParseResult>((resolve) => {
        const active = new Worker(new URL('./parse.worker.ts', import.meta.url), {
          type: 'module',
        })
        worker = active
        active.onmessage = (event: MessageEvent<WorkerReply>) => {
          const reply = event.data
          if (reply.kind === 'progress') {
            onProgress?.({ value: reply.value, label: reply.label })
            return
          }
          active.terminate()
          if (worker === active) worker = null
          resolve(reply.result)
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
