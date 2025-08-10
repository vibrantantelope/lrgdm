import { useMapContext } from '../MapContext'

export default function EraChips() {
  const { eras, eraColors, activeLayers, setLayerVisible } = useMapContext()
  if (!eras.length) return null
  return (
    <div id="eraChips" style={{ marginTop: 8 }}>
      {eras.map(era => {
        const name = `Lines: ${era}`
        const active = !!activeLayers[name]
        return (
          <span
            key={era}
            className={`chip ${active ? 'active' : ''}`}
            data-layer={name}
            style={{ background: eraColors[era] }}
            onClick={() => setLayerVisible(name, !active)}
          >
            {era}
          </span>
        )
      })}
    </div>
  )
}
