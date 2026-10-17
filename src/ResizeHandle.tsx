import { useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

type ResizeHandleProps = {
  label: string
  onResize: (deltaX: number) => void
}

const KEYBOARD_STEP = 16

export default function ResizeHandle({ label, onResize }: ResizeHandleProps) {
  const lastX = useRef(0)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    lastX.current = event.clientX
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId) !== true) return
    const delta = event.clientX - lastX.current
    if (delta === 0) return
    lastX.current = event.clientX
    onResize(delta)
  }

  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId) === true) {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onResize(-KEYBOARD_STEP)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      onResize(KEYBOARD_STEP)
    }
  }

  return (
    <div
      className="resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={handleKeyDown}
    />
  )
}
