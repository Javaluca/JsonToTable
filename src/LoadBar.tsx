type LoadBarProps = {
  label: string
  value: number | null
}

export default function LoadBar({ label, value }: LoadBarProps) {
  const indeterminate = value === null
  return (
    <div
      className="loadbar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(value * 100)}
      data-indeterminate={indeterminate}
    >
      <span
        className="loadbar-fill"
        style={indeterminate ? undefined : { transform: `scaleX(${value})` }}
      />
    </div>
  )
}
