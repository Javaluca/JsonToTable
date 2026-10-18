import Editor, { loader, type OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/editor/editor.api'
import 'monaco-editor/language/json/monaco.contribution'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/language/json/json.worker?worker'
import { useEffect, useRef } from 'react'
import { FONT_MONO } from './theme'

loader.config({ monaco })

type WorkerEnvironment = {
  getWorker: (workerId: string, label: string) => Worker
}

;(self as unknown as { MonacoEnvironment?: WorkerEnvironment }).MonacoEnvironment = {
  getWorker(_workerId, label) {
    return label === 'json' ? new JsonWorker() : new EditorWorker()
  },
}

monaco.editor.defineTheme('json-query-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '0550ae' },
    { token: 'string.value.json', foreground: '0a3069' },
    { token: 'number', foreground: '0550ae' },
    { token: 'keyword.json', foreground: '0550ae' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#1a1d21',
    'editorLineNumber.foreground': '#b4bac3',
    'editorLineNumber.activeForeground': '#5c6470',
    'editor.lineHighlightBackground': '#f6f7f9',
    'editorCursor.foreground': '#2563eb',
    'editor.selectionBackground': '#2563eb33',
    'editorWidget.background': '#f6f7f9',
    'editorSuggestWidget.background': '#ffffff',
  },
})

monaco.editor.defineTheme('json-query-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '7cb7ff' },
    { token: 'string.value.json', foreground: 'e6e9ee' },
    { token: 'number', foreground: '7cb7ff' },
    { token: 'keyword.json', foreground: '7cb7ff' },
  ],
  colors: {
    'editor.background': '#14171c',
    'editor.foreground': '#e6e9ee',
    'editorLineNumber.foreground': '#4a525e',
    'editorLineNumber.activeForeground': '#9aa3af',
    'editor.lineHighlightBackground': '#1a1e24',
    'editorCursor.foreground': '#3b82f6',
    'editor.selectionBackground': '#3b82f655',
    'editorWidget.background': '#1a1e24',
    'editorSuggestWidget.background': '#1a1e24',
  },
})

export type SourceRange = { start: number; end: number }

type JsonEditorProps = {
  ariaLabel: string
  value: string
  onChange: (value: string) => void
  theme: 'light' | 'dark'
  onSubmit?: () => void
  reveal?: SourceRange | null
}

export default function JsonEditor({
  ariaLabel,
  value,
  onChange,
  theme,
  onSubmit,
  reveal,
}: JsonEditorProps) {
  const submitRef = useRef(onSubmit)
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  useEffect(() => {
    submitRef.current = onSubmit
  }, [onSubmit])

  const handleMount: OnMount = (editor, instance) => {
    editorRef.current = editor
    editor.addCommand(instance.KeyMod.CtrlCmd | instance.KeyCode.Enter, () => {
      submitRef.current?.()
    })
  }

  useEffect(() => {
    const editor = editorRef.current
    if (editor === null || reveal == null) return
    const model = editor.getModel()
    if (model === null) return
    const from = model.getPositionAt(reveal.start)
    const to = model.getPositionAt(reveal.end)
    editor.setSelection(
      new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column),
    )
    editor.revealRangeInCenterIfOutsideViewport(
      new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column),
    )
  }, [reveal])

  return (
    <Editor
      value={value}
      language="json"
      theme={theme === 'dark' ? 'json-query-dark' : 'json-query-light'}
      onChange={(next) => onChange(next ?? '')}
      onMount={handleMount}
      options={{
        ariaLabel,
        minimap: { enabled: false },
        fontFamily: FONT_MONO,
        fontSize: 13,
        lineHeight: 20,
        tabSize: 2,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        padding: { top: 8, bottom: 8 },
        renderLineHighlight: 'none',
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        overviewRulerLanes: 0,
        guides: { indentation: false },
      }}
    />
  )
}
