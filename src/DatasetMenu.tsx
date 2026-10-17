import { useEffect, useRef, useState } from 'react'
import { SAMPLE_COLOR } from './dataset-colors'
import Logo from './Logo'
import type { DatasetEntry } from './dataset-store'

type DatasetMenuProps = {
  datasets: DatasetEntry[]
  activeId: string | null
  activeLabel: string
  activeColor: string
  showSample: boolean
  colorOf: (id: string) => string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onLoadSample: () => void
}

export default function DatasetMenu({
  datasets,
  activeId,
  activeLabel,
  activeColor,
  showSample,
  colorOf,
  onSelect,
  onRemove,
  onLoadSample,
}: DatasetMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const choose = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <div className="dataset-menu" ref={rootRef}>
      <button
        type="button"
        className="dataset-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Active Dataset: ${activeLabel}`}
        title="Json To Table"
        onClick={() => setOpen((value) => !value)}
      >
        <Logo />
        <span
          className="dataset-swatch"
          style={{ background: activeColor }}
          aria-hidden="true"
        />
        <span className="dataset-current">{activeLabel}</span>
        <span className="dataset-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <ul className="dataset-list" role="listbox" aria-label="Datasets">
          {datasets.map((entry) => (
            <li
              key={entry.id}
              className={`dataset-row${
                entry.id === activeId ? ' dataset-row-active' : ''
              }`}
              role="option"
              aria-label={entry.label}
              aria-selected={entry.id === activeId}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                choose(() => {
                  if (entry.id !== activeId) onSelect(entry.id)
                })
              }
            >
              <span
                className="dataset-swatch"
                style={{ background: colorOf(entry.id) }}
                aria-hidden="true"
              />
              <span className="dataset-item-label">{entry.label}</span>
              {entry.id === activeId ? (
                <span className="dataset-check" aria-hidden="true">
                  ✓
                </span>
              ) : (
                <span className="dataset-check" aria-hidden="true" />
              )}
              <button
                type="button"
                className="dataset-remove"
                aria-label={`Remove ${entry.label}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(entry.id)
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
          {showSample ? (
            <>
              {datasets.length > 0 ? (
                <li
                  className="dataset-divider"
                  role="presentation"
                  aria-hidden="true"
                />
              ) : null}
              <li
                className="dataset-row"
                role="option"
                aria-label="Sample dataset"
                aria-selected={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(onLoadSample)}
              >
                <span
                  className="dataset-swatch"
                  style={{ background: SAMPLE_COLOR }}
                  aria-hidden="true"
                />
                <span className="dataset-item-label">Sample dataset</span>
              </li>
            </>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
