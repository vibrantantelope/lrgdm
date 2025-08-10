import { useMapContext } from '../MapContext'

export default function LayerToggles() {
  const { activeLayers, setLayerVisible } = useMapContext()
  const layerNames = Object.keys(activeLayers)

  return (
    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {layerNames.map(name => (
        <label key={name} style={{ whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            data-layer={name}
            checked={!!activeLayers[name]}
            onChange={e => setLayerVisible(name, e.target.checked)}
          />{' '}
          {name}
        </label>
      ))}
    </div>
  )
}
