import {
  parseDataset,
  type ParseProgress,
  type ParseResult,
} from './parse-dataset'

type WorkerRequest = { text: string }

export type WorkerReply =
  | ({ kind: 'progress' } & ParseProgress)
  | { kind: 'result'; result: ParseResult }

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const reply = (message: WorkerReply) => self.postMessage(message)
  const result = parseDataset(event.data.text, (progress) =>
    reply({ kind: 'progress', ...progress }),
  )
  reply({ kind: 'result', result })
}
