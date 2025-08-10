import { useState } from 'react'
import { useMapContext } from '../MapContext'

const PRESETS = [
  {
    label: 'All',
    range: [1600, 2020],
    layers: ['People', 'Places', 'Events', 'Birth Points', 'Death Points'],
  },
  {
    label: 'People 1800-1900',
    range: [1800, 1900],
    layers: ['People'],
  },
]

export default function Search() {
  const [query, setQuery] = useState('')
  const { search, applyPreset } = useMapContext()

  const doSearch = () => {
    search(query)
  }

  return (
    <div>
      <input
        id="searchInput"
        type="text"
        placeholder="Search…"
        style={{ width: '100%' }}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            doSearch()
          }
        }}
      />
      <div
        id="presets"
        style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}
      >
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
