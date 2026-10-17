import type { Column } from './derive-columns'

type FieldsPanelProps = {
  columns: Column[]
  onPick: (clause: string) => void
}

export default function FieldsPanel({ columns, onPick }: FieldsPanelProps) {
  return (
    <section className="panel-section fields-panel" aria-label="Fields">
      <header className="panel-head">
        <span>Fields</span>
        <span className="panel-note">{columns.length}</span>
      </header>
      {columns.length === 0 ? (
        <p className="panel-empty">
          Load a Dataset and every Field path it holds appears here.
        </p>
      ) : (
        <ul className="field-list">
          {columns.map((column) => (
            <li key={column.field}>
              <button
                type="button"
                className="field-row"
                aria-label={`Ask about ${column.field}`}
                onClick={() => onPick(`${column.field}:`)}
              >
                <span className="field-path">{column.field}</span>
                <span className="field-sample">{column.sample}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
