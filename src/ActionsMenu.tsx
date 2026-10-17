import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from './Icons'

type ActionsMenuProps = {
  copied: boolean
  onCopy: () => void
  onDownload: () => void
}

export default function ActionsMenu({
  copied,
  onCopy,
  onDownload,
}: ActionsMenuProps) {
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
    <div className="actions-menu" ref={rootRef}>
      <button
        type="button"
        className="control control-actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{copied ? 'Copied' : 'Actions'}</span>
        <ChevronDownIcon />
      </button>

      {open ? (
        <ul className="actions-list" role="menu" aria-label="Actions">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="actions-item"
              onClick={() => choose(onCopy)}
            >
              Copy JSON
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="actions-item"
              onClick={() => choose(onDownload)}
            >
              Download JSON
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  )
}
