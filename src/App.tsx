import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { compileQuery } from './compile-query'
import { createDatasetSource } from './dataset-source'
import { deriveColumns } from './derive-columns'
import type { JsonRecord } from './parse-dataset'
import { SAMPLE_DATASET } from './sample-data'
import './styles.css'

ModuleRegistry.registerModules([AllCommunityModule])

const LIQE_DOCS_URL = 'https://github.com/gnavli/liqe'
const QUERY_DEBOUNCE_MS = 200

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

export default function App() {
  const [view, setView] = useState<View>('both')
  const [pastedText, setPastedText] = useState('')
  const [records, setRecords] = useState<JsonRecord[] | null>(null)
  const [matched, setMatched] = useState<JsonRecord[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [queryText, setQueryText] = useState('')
  const [queryError, setQueryError] = useState<string | null>(null)
  const sourceRef = useRef(createDatasetSource())

  const loadDataset = useCallback((text: string) => {
    setIsParsing(true)
    setLoadError(null)
    void sourceRef.current.parse(text).then((result) => {
      setIsParsing(false)
      if (result.ok) {
        setRecords(result.records)
        setMatched(result.records)
      } else {
        setLoadError(result.error)
      }
    })
  }, [])

  const cancelParsing = useCallback(() => {
    sourceRef.current.cancel()
    setIsParsing(false)
  }, [])

  useEffect(() => {
    return () => sourceRef.current.cancel()
  }, [])

  useEffect(() => {
    if (records === null) return
    const handle = window.setTimeout(() => {
      const compiled = compileQuery(queryText)
      if (compiled.ok) {
        setQueryError(null)
        setMatched(records.filter((record) => compiled.test(record)))
      } else {
        setQueryError(compiled.error)
      }
    }, QUERY_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [queryText, records])

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

  const showInput = view !== 'table'
  const showTable = view !== 'input'

  return (
    <main className="app">
      <header className="topbar">
        <h1>JSON Query Table</h1>
        <div className="view-switch" role="group" aria-label="View">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={view === option.id}
              onClick={() => setView(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="topbar-meta">
          {records === null
            ? 'No Dataset loaded'
            : `${records.length} Records in Dataset`}
        </p>
      </header>

      <div className="workspace">
        {showInput ? (
          <section className="panel input-panel">
            <label htmlFor="dataset-input">Paste a JSON array or NDJSON</label>
            <textarea
              id="dataset-input"
              value={pastedText}
              onChange={(event) => setPastedText(event.target.value)}
              placeholder='[{"id": 1, "name": "Ada"}]'
            />
            <div className="controls">
              <button
                type="button"
                className="primary"
                disabled={isParsing || pastedText.trim() === ''}
                onClick={() => loadDataset(pastedText)}
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
                        setPastedText('')
                        loadDataset(text)
                      })
                    }
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  const text = JSON.stringify(SAMPLE_DATASET, null, 2)
                  setPastedText(text)
                  loadDataset(text)
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

        {showTable ? (
          <section className="panel table-panel">
            <div className="query-bar">
              <label htmlFor="query-input">Query DSL</label>
              <input
                id="query-input"
                type="search"
                value={queryText}
                placeholder='e.g. address.city:london AND age:>40'
                onChange={(event) => setQueryText(event.target.value)}
              />
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
            {records === null ? (
              <p className="empty">
                Load a Dataset to start querying — paste JSON, upload a file, or
                use the sample data.
              </p>
            ) : (
              <>
                <p className="status">
                  {`Matching ${matched.length} of ${records.length} Records`}
                </p>
                <div className="grid">
                  <AgGridReact
                    rowData={matched}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                  />
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>
    </main>
  )
}
