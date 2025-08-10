import { useMapContext } from '../MapContext'

export default function BasemapSelector() {
  const { basemap, setBasemap, basemapOptions } = useMapContext()

  return (
    <div style={{ marginTop: 8 }}>
      <label>
        Basemap:
        <select
          value={basemap}
          onChange={e => setBasemap(e.target.value)}
          style={{ marginLeft: 4 }}
        >
          {basemapOptions.map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
