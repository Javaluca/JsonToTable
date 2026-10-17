import { useEffect } from 'react'
import JsonEditor from './JsonEditor'

type DatasetEditorDialogProps = {
  open: boolean
  value: string
  name: string
  theme: 'light' | 'dark'
  isParsing: boolean
  error: string | null
  onChange: (value: string) => void
  onNameChange: (value: string) => void
  onLoad: () => void
  onUpload: (file: File) => void
  onClose: () => void
}

export default function DatasetEditorDialog({
  open,
  value,
  name,
  theme,
  isParsing,
  error,
  onChange,
  onNameChange,
  onLoad,
  onUpload,
  onClose,
}: DatasetEditorDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="editor-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="New dataset"
    >
      <header className="editor-overlay-head">
        <div className="editor-overlay-heading">
          <input
            type="text"
            className="editor-name-input"
            value={name}
            placeholder="Dataset name (optional)"
            aria-label="Dataset name"
            autoFocus
            onChange={(event) => onNameChange(event.target.value)}
          />
          <p className="editor-overlay-hint">
            Overrides the automatic label. Paste a JSON array or NDJSON, or
            upload a file.
          </p>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Close editor"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="editor-overlay-body">
        <pre>
          <JsonEditor
            ariaLabel="Dataset JSON"
            value={value}
            onChange={onChange}
            theme={theme}
          />
        </pre>
      </div>

      <footer className="editor-overlay-foot">
        {error !== null ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="editor-overlay-actions">
          <label className="file-button">
            Upload file
            <input
              type="file"
              accept=".json,.ndjson,application/json,text/plain"
              aria-label="Upload a JSON or NDJSON file"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onUpload(file)
              }}
            />
          </label>
          <button
            type="button"
            className="control control-primary"
            disabled={isParsing || value.trim() === ''}
            onClick={onLoad}
          >
            {isParsing ? 'Parsing…' : 'Load'}
          </button>
        </div>
      </footer>
    </div>
  )
}
