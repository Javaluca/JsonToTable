import { useState } from 'react'
import Logo from './Logo'

type LandingProps = {
  onLoadSample: () => void
  onPaste: (text: string) => void
  onUpload: (file: File) => void
}

export default function Landing({ onLoadSample, onPaste, onUpload }: LandingProps) {
  const [dragging, setDragging] = useState(false)

  return (
    <div className="landing">
      <div className="landing-hero">
        <p className="landing-brand">
          <Logo size="md" />
          <span>Json To Table</span>
        </p>
        <h1 className="landing-title">
          Read JSON as a table, then narrow it with a clause.
        </h1>
        <p className="landing-lede">
          Paste a JSON array or NDJSON and filter its records with plain
          queries — <code>age:&gt;40</code>, <code>address.city:London</code>.
        </p>

        <textarea
          className="landing-paste"
          aria-label="Paste JSON"
          placeholder="Paste your JSON here…"
          rows={3}
          onFocus={() => onPaste('')}
        />

        <p className="landing-or" aria-hidden="true">
          or
        </p>

        <div
          className={`landing-drop${dragging ? ' landing-drop-active' : ''}`}
          role="group"
          aria-label="Upload or drop a file"
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const file = event.dataTransfer.files?.[0]
            if (file) onUpload(file)
          }}
        >
          <label className="landing-drop-button">
            <span className="landing-drop-icon" aria-hidden="true">
              ⇪
            </span>
            <span className="landing-drop-title">Upload a file</span>
            <span className="landing-drop-hint">
              or drag and drop a .json / .ndjson file
            </span>
            <input
              type="file"
              accept=".json,.ndjson,application/json,text/plain"
              aria-label="Upload a JSON or NDJSON file"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onUpload(file)
              }}
            />
          </label>
        </div>

        <ul className="landing-points">
          <li>Paste a JSON array or NDJSON, or upload a file.</li>
          <li>Narrow the Result Set with clauses as you type.</li>
          <li>Pick a Record to inspect every value it holds.</li>
          <li>Copy or download the Result Set as JSON.</li>
        </ul>

        <button type="button" className="landing-sample" onClick={onLoadSample}>
          Load the sample dataset
        </button>
      </div>
    </div>
  )
}
