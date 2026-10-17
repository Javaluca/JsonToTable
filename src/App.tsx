import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { compileQuery } from './compile-query'
import { createDatasetStore, type DatasetStore } from './dataset-store'
import { createDatasetSource } from './dataset-source'
import { deriveColumns } from './derive-columns'
import JsonEditor from './JsonEditor'
import type { JsonRecord } from './parse-dataset'
import { SAMPLE_DATASET } from './sample-data'
import { suggestValues } from './suggest-values'
import './styles.css'

ModuleRegistry.registerModules([AllCommunityModule])

const LIQE_DOCS_URL = 'https://github.com/gnavli/liqe'
const SUGGESTIONS_ID = 'query-suggestions'
const EDITOR_LABEL = 'Paste a JSON array or NDJSON'
const DEFAULT_INPUT_WIDTH = 360
const MIN_INPUT_WIDTH = 220
const MIN_TABLE_WIDTH = 320
const KEYBOARD_RESIZE_STEP = 16

type View = 'input' | 'table' | 'both'

const VIEWS: ReadonlyArray<{ id: View; label: string }> = [
  { id: 'input', label: 'Input' },
  { id: 'table', label: 'Table' },
  { id: 'both', label: 'Both' },
]

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export default function App() {
  const [view, setView] = useState<View>('both')
  const [inputWidth, setInputWidth] = useState(DEFAULT_INPUT_WIDTH)
  const [editorText, setEditorText] = useState('')
  const [records, setRecords] = useState<JsonRecord[] | null>(null)
  const [matched, setMatched] = useState<JsonRecord[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [queryText, setQueryText] = useState('')
  const [queryError, setQueryError] = useState<string | null>(null)
  const sourceRef = useRef(createDatasetSource())
  const storeRef = useRef<DatasetStore | undefined>(undefined)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  if (storeRef.current === undefined) {
    storeRef.current = createDatasetStore(window.localStorage)
  }
  const store = storeRef.current

  const [datasets, setDatasets] = useState(() => store.list())
  const [activeId, setActiveId] = useState<string | null>(null)

  const parseInto = useCallback(
    async (text: string): Promise<JsonRecord[] | null> => {
      setIsParsing(true)
      setLoadError(null)
      const result = await sourceRef.current.parse(text)
      setIsParsing(false)
      if (!result.ok) {
        setLoadError(result.error)
        return null
      }
      setRecords(result.records)
      setMatched(result.records)
      return result.records
    },
    [],
  )

  const addDataset = useCallback(
    async (text: string) => {
      const parsed = await parseInto(text)
      if (parsed === null) return
      const entries = store.add(text, parsed.length)
      setDatasets(entries)
      setActiveId(entries[0].id)
    },
    [parseInto, store],
  )

  const activateDataset = useCallback(
    async (id: string) => {
      const entry = datasets.find((candidate) => candidate.id === id)
      if (entry === undefined) return
      setEditorText(entry.text)
      const parsed = await parseInto(entry.text)
      if (parsed !== null) setActiveId(id)
    },
    [datasets, parseInto],
  )

  useEffect(() => {
    const [mostRecent] = store.list()
    if (mostRecent !== undefined) void activateDataset(mostRecent.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cancelParsing = useCallback(() => {
    sourceRef.current.cancel()
    setIsParsing(false)
  }, [])

  useEffect(() => {
    return () => sourceRef.current.cancel()
  }, [])

  const applyQuery = useCallback(
    (text: string) => {
      if (records === null) return
      const compiled = compileQuery(text)
      if (compiled.ok) {
        setQueryError(null)
        setMatched(records.filter((record) => compiled.test(record)))
      } else {
        setQueryError(compiled.error)
      }
    },
    [records],
  )

  const suggestions = useMemo(
    () => (records === null ? [] : suggestValues(records, queryText)),
    [records, queryText],
  )

  const maxInputWidth = useCallback(
    () => Math.max(MIN_INPUT_WIDTH, window.innerWidth - MIN_TABLE_WIDTH),
    [],
  )

  const handleSeparatorPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    dragRef.current = { startX: event.clientX, startWidth: inputWidth }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handleSeparatorPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const drag = dragRef.current
    if (drag === null) return
    setInputWidth(
      clamp(
        drag.startWidth + event.clientX - drag.startX,
        MIN_INPUT_WIDTH,
        maxInputWidth(),
      ),
    )
  }

  const handleSeparatorPointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    dragRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const handleSeparatorKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const step =
      event.key === 'ArrowRight' ? KEYBOARD_RESIZE_STEP : -KEYBOARD_RESIZE_STEP
    setInputWidth((width) =>
      clamp(width + step, MIN_INPUT_WIDTH, maxInputWidth()),
    )
  }

  const columnDefs = useMemo<ColDef[]>(
    () => (records === null ? [] : deriveColumns(records)),
    [records],
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      cellDataType: false,
      valueFormatter: (params) => formatCellValue(params.value),
    }),
    [],
  )

  const hasDatasets = records !== null
  const activeView: View = hasDatasets ? view : 'input'
  const counterLabel =
    records === null
      ? 'No Dataset loaded'
      : `Matching ${matched.length} of ${records.length} Records`

  const showInput = activeView !== 'table'
  const showTable = activeView !== 'input'

  return (
    <main className="app">
      <header className="topbar">
        <h1>JSON Query Table</h1>
        <div className="view-switch" role="group" aria-label="View">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={activeView === option.id}
              disabled={!hasDatasets}
              onClick={() => setView(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <select
          className="dataset-picker"
          aria-label="Active Dataset"
          value={activeId ?? ''}
          disabled={datasets.length === 0}
          onChange={(event) => void activateDataset(event.target.value)}
        >
          {datasets.length === 0 ? (
            <option value="">No Datasets</option>
          ) : (
            datasets.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))
          )}
        </select>
        <p className="topbar-status" aria-label={counterLabel}>
          {records === null
            ? 'No Dataset loaded'
            : `${matched.length} / ${records.length}`}
        </p>
      </header>

      <div className="workspace">
        {showInput ? (
          <section
            className="panel input-panel"
            style={
              activeView === 'both' ? { flex: `0 0 ${inputWidth}px` } : undefined
            }
          >
            <p className="panel-title">{EDITOR_LABEL}</p>
            <div className="editor">
              <JsonEditor
                ariaLabel={EDITOR_LABEL}
                value={editorText}
                onChange={setEditorText}
              />
            </div>
            <div className="controls">
              <button
                type="button"
                className="primary"
                disabled={isParsing || editorText.trim() === ''}
                onClick={() => void addDataset(editorText)}
              >
                Load JSON
              </button>
              <label className="file-button">
                Upload file
                <input
                  type="file"
                  accept=".json,.ndjson,application/json,text/plain"
                  aria-label="Upload a JSON or NDJSON file"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      void file.text().then((text) => {
                        setEditorText(text)
                        void addDataset(text)
                      })
                    }
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  const text = JSON.stringify(SAMPLE_DATASET, null, 2)
                  setEditorText(text)
                  void addDataset(text)
                }}
              >
                Load sample data
              </button>
              {isParsing ? (
                <button type="button" onClick={cancelParsing}>
                  Cancel parsing
                </button>
              ) : null}
            </div>
            {isParsing ? <p className="hint">Parsing Dataset…</p> : null}
            {loadError !== null ? (
              <p className="error" role="alert">
                {loadError}
              </p>
            ) : null}
          </section>
        ) : null}

        {activeView === 'both' ? (
          <div
            className="separator"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize input panel"
            aria-valuenow={inputWidth}
            aria-valuemin={MIN_INPUT_WIDTH}
            aria-valuemax={maxInputWidth()}
            tabIndex={0}
            onPointerDown={handleSeparatorPointerDown}
            onPointerMove={handleSeparatorPointerMove}
            onPointerUp={handleSeparatorPointerUp}
            onKeyDown={handleSeparatorKeyDown}
          />
        ) : null}

        {showTable ? (
          <section className="panel table-panel">
            <div className="query-bar">
              <label htmlFor="query-input">Query DSL</label>
              <input
                id="query-input"
                type="search"
                list={SUGGESTIONS_ID}
                value={queryText}
                placeholder='e.g. address.city:london AND age:>40'
                onChange={(event) => setQueryText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyQuery(queryText)
                }}
              />
              <datalist id={SUGGESTIONS_ID}>
                {suggestions.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
              <a
                className="docs-link"
                href={LIQE_DOCS_URL}
                target="_blank"
                rel="noreferrer"
              >
                syntax
              </a>
            </div>
            {queryError !== null ? (
              <p className="error" role="alert">
                {queryError}
              </p>
            ) : null}
            <p className="hint">Press Enter to run the query.</p>
            {records === null ? (
              <p className="empty">
                No Dataset loaded yet — paste JSON, upload a file, or use the
                sample data.
              </p>
            ) : (
              <div className="grid">
                <AgGridReact
                  rowData={matched}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  rowHeight={24}
                  headerHeight={28}
                />
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  )
}
