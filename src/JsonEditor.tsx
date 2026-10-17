import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/editor/editor.api'
import 'monaco-editor/language/json/monaco.contribution'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/language/json/json.worker?worker'

loader.config({ monaco })

type WorkerEnvironment = {
  getWorker: (workerId: string, label: string) => Worker
}

;(self as unknown as { MonacoEnvironment?: WorkerEnvironment }).MonacoEnvironment = {
  getWorker(_workerId, label) {
    return label === 'json' ? new JsonWorker() : new EditorWorker()
  },
}

type JsonEditorProps = {
  ariaLabel: string
  value: string
  onChange: (value: string) => void
}

export default function JsonEditor({ ariaLabel, value, onChange }: JsonEditorProps) {
  return (
    <Editor
      value={value}
      language="json"
      onChange={(next) => onChange(next ?? '')}
      options={{
        ariaLabel,
        minimap: { enabled: false },
        fontSize: 12,
        tabSize: 2,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        padding: { top: 8, bottom: 8 },
      }}
    />
  )
}
