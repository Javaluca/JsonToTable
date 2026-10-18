import { useEffect, useMemo, useRef, useState } from 'react'
import type { JsonRecord } from './parse-dataset'
import { recordFields } from './record-fields'
import { toRecordText } from './serialize'
import { CheckIcon, CopyIcon } from './Icons'

type RecordPanelProps = {
  record: JsonRecord | null
  inResultSet: boolean
  onNarrow: (clause: string) => void
  onCopy: (text: string) => Promise<boolean>
}

export default function RecordPanel({
  record,
  inResultSet,
  onNarrow,
  onCopy,
}: RecordPanelProps) {
  const fields = useMemo(
    () => (record === null ? [] : recordFields(record)),
    [record],
  )
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    setCopied(false)
  }, [record])

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current)
  }, [])

  const copyRecord = () => {
    if (record === null) return
    void onCopy(toRecordText(record)).then((ok) => {
      if (!ok) return
      setCopied(true)
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <section className="panel-section record-panel" aria-label="Record">
      <header className="panel-head">
        <span>Record</span>
        <span className="record-head-tail">
          {record !== null && !inResultSet ? (
            <span className="panel-note">filtered out</span>
          ) : null}
          {record !== null ? (
            <button
              type="button"
              className="record-copy"
              data-copied={copied}
              title={copied ? 'Copied' : 'Copy this Record as JSON'}
              aria-label={copied ? 'Copied' : 'Copy JSON'}
              onClick={copyRecord}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          ) : null}
        </span>
      </header>
      {record === null ? (
        <p className="panel-empty">
          Pick a row in the table to read every value it holds.
        </p>
      ) : (
        <ul className="record-body">
          {fields.map((field) => (
            <li className="record-row" key={field.path}>
              <span className="record-path">{field.path}</span>
              {field.options.length === 0 ? (
                <span className="record-value-plain">{field.display}</span>
              ) : field.options.length === 1 ? (
                <button
                  type="button"
                  className="record-value"
                  aria-label={`Narrow to ${field.options[0].clause}`}
                  onClick={() => onNarrow(field.options[0].clause)}
                >
                  {field.display}
                </button>
              ) : (
                <span className="record-chips">
                  {field.options.map((option) => (
                    <button
                      type="button"
                      className="chip"
                      key={option.clause}
                      aria-label={`Narrow to ${option.clause}`}
                      onClick={() => onNarrow(option.clause)}
                    >
                      {option.label}
                    </button>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
