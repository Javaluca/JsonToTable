import { parseDataset } from './parse-dataset'

self.onmessage = (event: MessageEvent<{ text: string }>) => {
  self.postMessage(parseDataset(event.data.text))
}
