import { useMapContext } from '../MapContext'

const LAYERS = ['People', 'Places', 'Events', 'Birth Points', 'Death Points']

export default function LayerToggles() {
  const { activeLayers, setLayerVisible } = useMapContext()
  return (
    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {LAYERS.map(name => (
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
