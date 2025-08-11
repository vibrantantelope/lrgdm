import { useEffect, useState } from 'react'

export default function DataUpdated() {
  const [text, setText] = useState('Loading…')
  useEffect(() => {
    fetch('/data/places.geojson', { method: 'HEAD' })
      .then(r => {
        const d = r.headers.get('last-modified')
        if (d) setText(`Data last updated: ${new Date(d).toLocaleString()}`)
        else setText('')
      })
      .catch(() => setText(''))
  }, [])
  if (!text) return null
  return (
    <div id="updated" className="legend dim">
      {text}
    </div>
  )
}
