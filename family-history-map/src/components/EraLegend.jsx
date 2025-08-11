import { useMapContext } from '../MapContext'

export default function EraLegend() {
  const { eraColors } = useMapContext()
  const entries = Object.entries(eraColors)
  if (!entries.length) return null
  return (
    <div id="eraLegend" className="legend">
      <b>Birth→Death Lines (Eras)</b>
      {entries.map(([label, col]) => (
        <div key={label}>
          <span className="swatch" style={{ background: col }} /> {label}
        </div>
      ))}
    </div>
  )
}
