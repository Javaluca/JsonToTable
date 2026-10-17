import { useEffect, useRef, useState } from 'react'
import type { Column } from './derive-columns'
import FieldsPanel from './FieldsPanel'
import { ChevronUpIcon } from './Icons'

type FieldsMenuProps = {
  columns: Column[]
  onPick: (clause: string) => void
}

export default function FieldsMenu({ columns, onPick }: FieldsMenuProps) {
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

  const pick = (clause: string) => {
    setOpen(false)
    onPick(clause)
  }

  return (
    <div className="fields-menu" ref={rootRef}>
      <button
        type="button"
        className="statusbar-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Fields
        <ChevronUpIcon />
      </button>

      {open ? (
        <div className="fields-popover">
          <FieldsPanel columns={columns} onPick={pick} />
        </div>
      ) : null}
    </div>
  )
}
