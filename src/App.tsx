import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent as ReactChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type RowClassParams,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import ActionsMenu from './ActionsMenu'
import { compileQuery } from './compile-query'
import { colorForIndex, SAMPLE_COLOR } from './dataset-colors'
import DatasetEditorDialog from './DatasetEditorDialog'
import DatasetMenu from './DatasetMenu'
import { createDatasetStore, type DatasetStore } from './dataset-store'
import { createDatasetSource } from './dataset-source'
import { deriveColumns } from './derive-columns'
import FieldsMenu from './FieldsMenu'
import { copyText, downloadText } from './files'
import { InputIcon, InspectorIcon, TableIcon } from './Icons'
import JsonEditor from './JsonEditor'
import Landing from './Landing'
import type { JsonRecord } from './parse-dataset'
import { refineQuery } from './query-clause'
import RecordPanel from './RecordPanel'
import ResizeHandle from './ResizeHandle'
import { SAMPLE_DATASET } from './sample-data'
import { downloadName, toJsonText } from './serialize'
import { suggestQuery } from './suggest-query'
import { gridThemeDark, gridThemeLight } from './theme'
import './styles.css'

ModuleRegistry.registerModules([AllCommunityModule])

const LIQE_DOCS_URL = 'https://github.com/gnavli/liqe'
const SUGGESTIONS_LIST_ID = 'query-suggestions'

const SAMPLE_TEXT = JSON.stringify(SAMPLE_DATASET, null, 2)

function suggestionOptionId(index: number): string {
  return `query-suggestion-${index}`
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function useIsDark(): boolean {
  const [dark, setDark] = useState(() => {
    if (typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setDark(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return dark
}

export default function App() {
  const [editorText, setEditorText] = useState('')
  const [editorName, setEditorName] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [records, setRecords] = useState<JsonRecord[] | null>(null)
  const [matched, setMatched] = useState<JsonRecord[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [queryText, setQueryText] = useState('')
  const [queryCaret, setQueryCaret] = useState(0)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<JsonRecord | null>(null)
  const [inputOpen, setInputOpen] = useState(true)
  const [tableOpen, setTableOpen] = useState(true)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [inputWidth, setInputWidth] = useState(340)
  const [inspectorWidth, setInspectorWidth] = useState(320)
  const [sourceText, setSourceText] = useState('')
  const [sourceError, setSourceError] = useState<string | null>(null)
  const [meterReady, setMeterReady] = useState(false)
  const [copiedResult, setCopiedResult] = useState(false)
  const isDark = useIsDark()
  const sourceRef = useRef(createDatasetSource())
  const storeRef = useRef<DatasetStore | undefined>(undefined)
  const queryInputRef = useRef<HTMLInputElement>(null)
  const pendingCaretRef = useRef<number | null>(null)
  const queryMemoryRef = useRef(new Map<string, string>())
  const copyTimerRef = useRef<number | undefined>(undefined)

  if (storeRef.current === undefined) {
    storeRef.current = createDatasetStore(window.localStorage)
  }
  const store = storeRef.current

  const [datasets, setDatasets] = useState(() => store.list())
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMeterReady(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    return () => {
      sourceRef.current.cancel()
      window.clearTimeout(copyTimerRef.current)
    }
  }, [])

  const runQuery = useCallback((all: JsonRecord[], text: string) => {
    if (text.trim() === '') {
      setQueryError(null)
      setMatched(all)
      return
    }
    const compiled = compileQuery(text)
    if (!compiled.ok) {
      setQueryError(compiled.error)
      return
    }
    setQueryError(null)
    setMatched(all.filter((record) => compiled.test(record)))
  }, [])

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

  const activateDataset = useCallback(
    async (id: string) => {
      const entry = datasets.find((candidate) => candidate.id === id)
      if (entry === undefined) return
      setEditorText(entry.text)
      setSourceText(entry.text)
      setSourceError(null)
      const parsed = await parseInto(entry.text)
      if (parsed === null) return
      setActiveId(id)
      setSelectedRecord(null)
      const remembered = queryMemoryRef.current.get(id) ?? ''
      setQueryText(remembered)
      runQuery(parsed, remembered)
    },
    [datasets, parseInto, runQuery],
  )

  const loadIntoStore = useCallback(
    async (text: string, name?: string): Promise<boolean> => {
      const parsed = await parseInto(text)
      if (parsed === null) return false
      const entries = store.add(text, parsed.length, name)
      setDatasets(entries)
      setActiveId(entries[0].id)
      setSourceText(text)
      setSourceError(null)
      setSelectedRecord(null)
      setQueryText('')
      setQueryError(null)
      queryMemoryRef.current.delete(entries[0].id)
      setEditorOpen(false)
      return true
    },
    [parseInto, store],
  )

  const uploadFile = useCallback(
    (file: File) => {
      void file.text().then(async (text) => {
        setEditorText(text)
        const ok = await loadIntoStore(text, editorName)
        if (!ok) setEditorOpen(true)
      })
    },
    [editorName, loadIntoStore],
  )

  const loadSample = useCallback(() => {
    setEditorText(SAMPLE_TEXT)
    void loadIntoStore(SAMPLE_TEXT)
  }, [loadIntoStore])

  useEffect(() => {
    const [mostRecent] = store.list()
    if (mostRecent !== undefined) {
      void activateDataset(mostRecent.id)
      return
    }
    if (new URLSearchParams(window.location.search).get('dataset') === 'sample') {
      loadSample()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openEditor = useCallback((text: string) => {
    setEditorText(text)
    setEditorName('')
    setLoadError(null)
    setEditorOpen(true)
  }, [])

  const openNewEditor = useCallback(() => openEditor(''), [openEditor])

  const closeEditor = useCallback(() => {
    setEditorOpen(false)
    setLoadError(null)
  }, [])

  const applySource = useCallback(async () => {
    if (activeId === null) return
    setIsParsing(true)
    const result = await sourceRef.current.parse(sourceText)
    setIsParsing(false)
    if (!result.ok) {
      setSourceError(result.error)
      return
    }
    setSourceError(null)
    setRecords(result.records)
    setSelectedRecord(null)
    const entries = store.update(activeId, sourceText, result.records.length)
    setDatasets(entries)
    runQuery(result.records, queryText)
  }, [activeId, queryText, runQuery, sourceText, store])

  const resizeInput = useCallback((delta: number) => {
    setInputWidth((width) => Math.min(640, Math.max(220, width + delta)))
  }, [])

  const resizeInspector = useCallback((delta: number) => {
    setInspectorWidth((width) => Math.min(640, Math.max(220, width - delta)))
  }, [])

  const selectRecord = useCallback((record: JsonRecord) => {
    setSelectedRecord(record)
  }, [])

  const inspectRecord = useCallback((record: JsonRecord) => {
    setSelectedRecord(record)
    setInspectorOpen(true)
  }, [])

  const views = { input: inputOpen, table: tableOpen, inspector: inspectorOpen }
  const visibleViews =
    (inputOpen ? 1 : 0) + (tableOpen ? 1 : 0) + (inspectorOpen ? 1 : 0)
  const isLastView = (view: keyof typeof views) =>
    views[view] && visibleViews === 1
  const toggleView = (view: keyof typeof views) => {
    if (isLastView(view)) return
    if (view === 'input') setInputOpen((open) => !open)
    else if (view === 'table') setTableOpen((open) => !open)
    else setInspectorOpen((open) => !open)
  }

  const removeDataset = useCallback(
    (id: string) => {
      const entries = store.remove(id)
      setDatasets(entries)
      if (id !== activeId) return
      const [next] = entries
      if (next !== undefined) {
        void activateDataset(next.id)
        return
      }
      sourceRef.current.cancel()
      setActiveId(null)
      setRecords(null)
      setMatched([])
      setSelectedRecord(null)
      setQueryText('')
      setQueryError(null)
      setEditorText('')
      setEditorName('')
      setEditorOpen(false)
      setLoadError(null)
      setSourceText('')
      setSourceError(null)
    },
    [activeId, activateDataset, store],
  )

  const rememberQuery = useCallback((text: string) => {
    if (activeId === null) return
    queryMemoryRef.current.set(activeId, text)
  }, [activeId])

  const putClause = useCallback(
    (clause: string, run: boolean) => {
      if (records === null) return
      const next = refineQuery(queryText, clause)
      pendingCaretRef.current = next.length
      setQueryText(next)
      setQueryCaret(next.length)
      setSuggestionsDismissed(true)
      rememberQuery(next)
      if (run) runQuery(records, next)
      queryInputRef.current?.focus()
    },
    [queryText, records, rememberQuery, runQuery],
  )

  const narrowTo = useCallback(
    (clause: string) => putClause(clause, true),
    [putClause],
  )

  const clearQuery = useCallback(() => {
    setQueryText('')
    setQueryCaret(0)
    setSuggestionsDismissed(true)
    rememberQuery('')
    if (records !== null) runQuery(records, '')
    queryInputRef.current?.focus()
  }, [records, rememberQuery, runQuery])

  const suggestions = useMemo(
    () => (records === null ? [] : suggestQuery(records, queryText, queryCaret)),
    [queryCaret, queryText, records],
  )

  const menuOpen = suggestions.length > 0 && !suggestionsDismissed

  const acceptSuggestion = useCallback(
    (index: number) => {
      const suggestion = suggestions[index]
      if (suggestion === undefined) return
      const next = `${queryText.slice(0, suggestion.replaceFrom)}${suggestion.value}${queryText.slice(suggestion.replaceTo)}`
      pendingCaretRef.current = suggestion.replaceFrom + suggestion.value.length
      setQueryText(next)
      setQueryCaret(pendingCaretRef.current)
      setSuggestionsDismissed(true)
    },
    [queryText, suggestions],
  )

  useEffect(() => {
    setActiveSuggestion(0)
  }, [suggestions])

  useEffect(() => {
    const caret = pendingCaretRef.current
    if (caret === null) return
    pendingCaretRef.current = null
    queryInputRef.current?.setSelectionRange(caret, caret)
  }, [queryText])

  const handleQueryChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    setQueryText(event.target.value)
    setQueryCaret(event.target.selectionStart ?? event.target.value.length)
    setSuggestionsDismissed(false)
  }

  const handleQueryKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (menuOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveSuggestion((index) => (index + 1) % suggestions.length)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveSuggestion(
          (index) => (index - 1 + suggestions.length) % suggestions.length,
        )
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        acceptSuggestion(activeSuggestion)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setSuggestionsDismissed(true)
        return
      }
    }
    if (event.key === 'Enter' && records !== null) {
      rememberQuery(queryText)
      runQuery(records, queryText)
    }
  }

  const columns = useMemo(
    () => (records === null ? [] : deriveColumns(records)),
    [records],
  )

  const columnDefs = useMemo<ColDef[]>(
    () =>
      columns.map((column) => ({
        field: column.field,
        type: column.numeric ? 'numericColumn' : undefined,
      })),
    [columns],
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      flex: 1,
      minWidth: 100,
      sortable: true,
      filter: true,
      resizable: true,
      cellDataType: false,
      valueFormatter: (params) => formatCellValue(params.value),
    }),
    [],
  )

  const rowClassRules = useMemo(
    () => ({
      'row-picked': (params: RowClassParams) => params.data === selectedRecord,
    }),
    [selectedRecord],
  )

  const colorById = useMemo(() => {
    const ordered = [...datasets].sort((a, b) => a.savedAt - b.savedAt)
    return new Map(
      ordered.map((entry, index) => [entry.id, colorForIndex(index)]),
    )
  }, [datasets])

  const colorOf = useCallback(
    (id: string) => colorById.get(id) ?? SAMPLE_COLOR,
    [colorById],
  )

  const activeEntry = datasets.find((entry) => entry.id === activeId)
  const loaded = records !== null
  const recordCount = records?.length ?? 0
  const ratio = recordCount === 0 ? 0 : matched.length / recordCount
  const gridTheme = isDark ? gridThemeDark : gridThemeLight
  const counterLabel = loaded
    ? `Matching ${matched.length} of ${recordCount} Records`
    : 'No Dataset loaded'
  const activeLabel = activeEntry?.label ?? 'No dataset'
  const activeColor =
    activeEntry !== undefined ? colorOf(activeEntry.id) : SAMPLE_COLOR
  const sampleInStore = datasets.some((entry) => entry.text === SAMPLE_TEXT)

  const copyResultSet = () => {
    if (records === null) return
    void copyText(toJsonText(matched)).then((ok) => {
      if (!ok) return
      setCopiedResult(true)
      window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopiedResult(false), 1800)
    })
  }

  const downloadResultSet = () => {
    if (records === null) return
    downloadText(toJsonText(matched), downloadName())
  }

  return (
    <main className="app">
      {loaded ? (
        <>
          <header className="toolbar">
            <div className="toolbar-group toolbar-lead">
              <DatasetMenu
                datasets={datasets}
                activeId={activeId}
                activeLabel={activeLabel}
                activeColor={activeColor}
                showSample={!sampleInStore}
                colorOf={colorOf}
                onSelect={(id) => void activateDataset(id)}
                onRemove={removeDataset}
                onLoadSample={loadSample}
              />
              <button
                type="button"
                className="control control-primary"
                onClick={openNewEditor}
              >
                New dataset
              </button>
            </div>

            <div className="toolbar-group toolbar-query">
              <div className="query-field">
                <input
                  ref={queryInputRef}
                  className="query-input"
                  type="text"
                  role="combobox"
                  aria-label="Query"
                  autoComplete="off"
                  aria-expanded={menuOpen}
                  aria-controls={SUGGESTIONS_LIST_ID}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    menuOpen ? suggestionOptionId(activeSuggestion) : undefined
                  }
                  value={queryText}
                  placeholder="e.g. address.city:London AND age:>40"
                  onChange={handleQueryChange}
                  onKeyDown={handleQueryKeyDown}
                  onBlur={() => setSuggestionsDismissed(true)}
                />
                {queryText !== '' ? (
                  <button
                    type="button"
                    className="query-clear"
                    aria-label="Clear query"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={clearQuery}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                ) : null}
                {menuOpen ? (
                  <ul
                    id={SUGGESTIONS_LIST_ID}
                    className="suggestions"
                    role="listbox"
                    aria-label="Query suggestions"
                  >
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={`${suggestion.kind}:${suggestion.value}`}
                        className="suggestion"
                        id={suggestionOptionId(index)}
                        role="option"
                        aria-label={suggestion.value}
                        aria-selected={index === activeSuggestion}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActiveSuggestion(index)}
                        onClick={() => acceptSuggestion(index)}
                      >
                        <span className="suggestion-value">
                          {suggestion.value}
                        </span>
                        <span className="suggestion-kind" aria-hidden="true">
                          {suggestion.kind}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <a
                className="docs-link"
                href={LIQE_DOCS_URL}
                target="_blank"
                rel="noreferrer"
              >
                <span className="docs-glyph" aria-hidden="true">
                  {'{ }'}
                </span>
                syntax
              </a>
            </div>

            <div className="toolbar-group toolbar-actions">
              <ActionsMenu
                copied={copiedResult}
                onCopy={copyResultSet}
                onDownload={downloadResultSet}
              />
            </div>

            <div className="toolbar-group toolbar-panels">
              <div className="view-group" role="group" aria-label="Views">
                <button
                  type="button"
                  className="view-button"
                  aria-pressed={inputOpen}
                  aria-label="Input"
                  title="Input"
                  disabled={isLastView('input')}
                  onClick={() => toggleView('input')}
                >
                  <InputIcon />
                </button>
                <button
                  type="button"
                  className="view-button"
                  aria-pressed={tableOpen}
                  aria-label="Table"
                  title="Table"
                  disabled={isLastView('table')}
                  onClick={() => toggleView('table')}
                >
                  <TableIcon />
                </button>
                <button
                  type="button"
                  className="view-button"
                  aria-pressed={inspectorOpen}
                  aria-label="Inspector"
                  title="Inspector"
                  disabled={isLastView('inspector')}
                  onClick={() => toggleView('inspector')}
                >
                  <InspectorIcon />
                </button>
              </div>
            </div>
          </header>

          <div
            className={`workspace${tableOpen ? '' : ' workspace--no-table'}`}
          >
            {inputOpen ? (
              <>
                <section
                  className="panel input-panel"
                  aria-label="Input"
                  style={{ flexBasis: `${inputWidth}px` }}
                >
                  <header className="panel-head">
                    <span>Input</span>
                    <button
                      type="button"
                      className="control control-primary control-sm"
                      disabled={isParsing}
                      onClick={() => void applySource()}
                    >
                      {isParsing ? 'Parsing…' : 'Apply'}
                    </button>
                  </header>
                  <div className="panel-body">
                    <JsonEditor
                      ariaLabel="Dataset source"
                      value={sourceText}
                      onChange={setSourceText}
                      theme={isDark ? 'dark' : 'light'}
                    />
                  </div>
                  {sourceError !== null ? (
                    <p className="panel-error" role="alert">
                      {sourceError}
                    </p>
                  ) : null}
                </section>
                <ResizeHandle label="Resize Input" onResize={resizeInput} />
              </>
            ) : null}

            {tableOpen ? (
              <section className="panel table-panel" aria-label="Result Set">
                {records.length === 0 ? (
                  <p className="empty">This Dataset holds no Records.</p>
                ) : (
                  <div className="grid">
                    <AgGridReact
                      theme={gridTheme}
                      rowData={matched}
                      columnDefs={columnDefs}
                      defaultColDef={defaultColDef}
                      rowClassRules={rowClassRules}
                      rowSelection="single"
                      onRowClicked={(event) => selectRecord(event.data)}
                      onRowDoubleClicked={(event) =>
                        inspectRecord(event.data)
                      }
                    />
                  </div>
                )}
              </section>
            ) : null}

            {inspectorOpen ? (
              <>
                <ResizeHandle
                  label="Resize Inspector"
                  onResize={resizeInspector}
                />
                <aside
                  className="panel inspector-panel"
                  aria-label="Inspector"
                  style={{ flexBasis: `${inspectorWidth}px` }}
                >
                  <RecordPanel
                    record={selectedRecord}
                    inResultSet={
                      selectedRecord === null || matched.includes(selectedRecord)
                    }
                    onNarrow={narrowTo}
                    onCopy={copyText}
                  />
                </aside>
              </>
            ) : null}
          </div>

          <footer className="statusbar">
            <div className="statusbar-group">
              <FieldsMenu
                columns={columns}
                onPick={(clause) => putClause(clause, false)}
              />
              <span className="statusbar-divider" aria-hidden="true" />
              <div className="status-group">
                <p className="status" aria-label={counterLabel}>
                  {`${matched.length} / ${recordCount}`}
                </p>
                <span className="meter" aria-hidden="true">
                  <span
                    className="meter-fill"
                    style={{ transform: `scaleX(${meterReady ? ratio : 0})` }}
                  />
                </span>
              </div>
            </div>
            <div className="statusbar-group statusbar-tail">
              {queryError !== null ? (
                <span className="statusbar-error" role="alert">
                  {queryError}
                </span>
              ) : (
                <span>
                  Double-click a row to inspect it. Type a clause and press
                  Enter to narrow the Result Set.
                </span>
              )}
            </div>
          </footer>
        </>
      ) : (
        <Landing
          onLoadSample={loadSample}
          onPaste={openEditor}
          onUpload={uploadFile}
        />
      )}

      <DatasetEditorDialog
        open={editorOpen}
        value={editorText}
        name={editorName}
        theme={isDark ? 'dark' : 'light'}
        isParsing={isParsing}
        error={loadError}
        onChange={setEditorText}
        onNameChange={setEditorName}
        onLoad={() => void loadIntoStore(editorText, editorName)}
        onUpload={uploadFile}
        onClose={closeEditor}
      />
    </main>
  )
}
