/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet-arrowheads'

const MapContext = createContext(null)

// Available basemap layers
const basemapLayers = {
  OpenStreetMap: L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '&copy; OpenStreetMap contributors' },
  ),
  OpenTopoMap: L.tileLayer(
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    {
      attribution:
        'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    },
  ),
  'Stamen Toner': L.tileLayer(
    'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
    {
      attribution:
        'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
    },
  ),
}

function popupTable(props) {
  return `<table>${Object.entries(props)
    .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
    .join('')}</table>`
}

export function MapProvider({ children }) {
  const mapRef = useRef(null)
  const overlaysRef = useRef({})
  const searchIndexRef = useRef([])
  const yearFiltersRef = useRef([])

  const [yearStart, setYearStart] = useState(1600)
  const [yearEnd, setYearEnd] = useState(2020)
  const [eras, setEras] = useState([])
  const [activeLayers, setActiveLayers] = useState({})
  const [basemap, setBasemap] = useState('OpenStreetMap')
  const basemapRef = useRef(null)

  const eraColors = {
    'Early Republic': '#d9534f',
    'Gilded Age': '#f0ad4e',
    'Colonial Era': '#5cb85c',
    'Civil War & Reconstruction': '#5bc0de',
    'Progressive Era & WWI': '#337ab7',
    'Roaring 20s & Great Depression': '#8e44ad',
  }

  useEffect(() => {
    mapRef.current = L.map('map').setView([0, 0], 2)

    const loadJson = url => fetch(url).then(r => r.json())

    const addOverlay = (layer, name, checked = true) => {
      overlaysRef.current[name] = layer
      setActiveLayers(prev => ({ ...prev, [name]: checked }))
      if (checked) mapRef.current.addLayer(layer)
    }

    // People
    loadJson('/data/people.geojson').then(data => {
      const layer = L.geoJSON([], {
        pointToLayer: (f, latlng) =>
          L.circleMarker(latlng, {
            radius: 6,
            color: '#0A84FF',
            weight: 1,
            fillOpacity: 0.9,
          }),
        onEachFeature: (f, l) => l.bindPopup(popupTable(f.properties || {})),
      })
      const render = (start, end) => {
        layer.clearLayers()
        const feats = (data.features || []).filter(f => {
          const y = f.properties?.birth_year || f.properties?.death_year
          return !y || (y >= start && y <= end)
        })
        layer.addData({ type: 'FeatureCollection', features: feats })
      }
      yearFiltersRef.current.push(render)
      render(yearStart, yearEnd)
      const cluster = L.markerClusterGroup({ spiderfyOnMaxZoom: true })
      cluster.addLayer(layer)
      addOverlay(cluster, 'People', true)
      ;(data.features || []).forEach(f =>
        searchIndexRef.current.push({ feature: f, field: 'people' }),
      )
    })

    // Places
    loadJson('/data/places.geojson').then(data => {
      const layer = L.geoJSON(data, {
        pointToLayer: (f, latlng) =>
          L.circleMarker(latlng, {
            radius: 6,
            color: '#2ed573',
            weight: 1,
            fillOpacity: 0.6,
          }),
        style: () => ({
          color: '#2ed573',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.2,
        }),
        onEachFeature: (f, l) => l.bindPopup(popupTable(f.properties || {})),
      })
      const cluster = L.markerClusterGroup({ spiderfyOnMaxZoom: true })
      cluster.addLayer(layer)
      addOverlay(cluster, 'Places', true)
      ;(data.features || []).forEach(f =>
        searchIndexRef.current.push({ feature: f, field: 'places' }),
      )
    })

    // Events
    loadJson('/data/events.geojson').then(data => {
      const layer = L.geoJSON([], {
        pointToLayer: (f, latlng) =>
          L.circleMarker(latlng, {
            radius: 6,
            color: '#b30000',
            weight: 1,
            fillOpacity: 0.9,
          }),
        style: () => ({ color: '#ff6b6b', weight: 2, opacity: 0.9 }),
        onEachFeature: (f, l) => l.bindPopup(popupTable(f.properties || {})),
      })
      const render = (start, end) => {
        layer.clearLayers()
        const feats = (data.features || []).filter(f => {
          const y = f.properties?.event_year
          return !y || (y >= start && y <= end)
        })
        layer.addData({ type: 'FeatureCollection', features: feats })
      }
      yearFiltersRef.current.push(render)
      render(yearStart, yearEnd)
      const cluster = L.markerClusterGroup({ spiderfyOnMaxZoom: true })
      cluster.addLayer(layer)
      addOverlay(cluster, 'Events', false)
      ;(data.features || []).forEach(f =>
        searchIndexRef.current.push({ feature: f, field: 'events' }),
      )
    })

    // Birth Points
    loadJson('/data/birth_location_points.geojson').then(data => {
      const layer = L.geoJSON([], {
        pointToLayer: (f, latlng) =>
          L.circleMarker(latlng, {
            radius: 6,
            color: '#1f77ff',
            weight: 1,
            fillOpacity: 0.9,
          }),
        onEachFeature: (f, l) => l.bindPopup(popupTable(f.properties || {})),
      })
      const render = (start, end) => {
        layer.clearLayers()
        const feats = (data.features || []).filter(f => {
          const y = f.properties?.birth_year
          return !y || (y >= start && y <= end)
        })
        layer.addData({ type: 'FeatureCollection', features: feats })
      }
      yearFiltersRef.current.push(render)
      render(yearStart, yearEnd)
      const cluster = L.markerClusterGroup({ spiderfyOnMaxZoom: true })
      cluster.addLayer(layer)
      addOverlay(cluster, 'Birth Points', true)
      ;(data.features || []).forEach(f =>
        searchIndexRef.current.push({ feature: f, field: 'births' }),
      )
    })

    // Death Points
    loadJson('/data/death_location_points.geojson').then(data => {
      const layer = L.geoJSON([], {
        pointToLayer: (f, latlng) =>
          L.circleMarker(latlng, {
            radius: 6,
            color: '#e43f3f',
            weight: 1,
            fillOpacity: 0.9,
          }),
        onEachFeature: (f, l) => l.bindPopup(popupTable(f.properties || {})),
      })
      const render = (start, end) => {
        layer.clearLayers()
        const feats = (data.features || []).filter(f => {
          const y = f.properties?.death_year
          return !y || (y >= start && y <= end)
        })
        layer.addData({ type: 'FeatureCollection', features: feats })
      }
      yearFiltersRef.current.push(render)
      render(yearStart, yearEnd)
      const cluster = L.markerClusterGroup({ spiderfyOnMaxZoom: true })
      cluster.addLayer(layer)
      addOverlay(cluster, 'Death Points', true)
      ;(data.features || []).forEach(f =>
        searchIndexRef.current.push({ feature: f, field: 'deaths' }),
      )
    })

    // Era lines
    loadJson('/data/birth_to_death_lines_eras.geojson').then(data => {
      const eras = Array.from(
        new Set((data.features || []).map(f => f.properties?.era).filter(Boolean)),
      ).sort()
      setEras(eras)
      const lineLayers = {}
      eras.forEach(era => {
        const sub = L.geoJSON([], {
          style: () => ({
            color: eraColors[era] || '#000',
            weight: 2.5,
            opacity: 0.95,
          }),
          onEachFeature: (f, l) => l.bindPopup(popupTable(f.properties || {})),
          arrowheads: { size: '8px', frequency: 'endonly', fill: true },
        })
        lineLayers[era] = sub
        addOverlay(sub, `Lines: ${era}`, true)
      })
      const render = (start, end) => {
        eras.forEach(era => {
          const layer = lineLayers[era]
          layer.clearLayers()
          const feats = (data.features || []).filter(f => {
            const p = f.properties || {}
            const y = p.birth_year || p.death_year
            return p.era === era && (!y || (y >= start && y <= end))
          })
          layer.addData({ type: 'FeatureCollection', features: feats })
        })
      }
      yearFiltersRef.current.push(render)
      render(yearStart, yearEnd)
      ;(data.features || []).forEach(f =>
        searchIndexRef.current.push({ feature: f, field: 'lines' }),
      )
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    const layer = basemapLayers[basemap]
    if (!layer) return
    if (basemapRef.current) mapRef.current.removeLayer(basemapRef.current)
    layer.addTo(mapRef.current)
    basemapRef.current = layer
  }, [basemap])

  useEffect(() => {
    yearFiltersRef.current.forEach(fn => fn(yearStart, yearEnd))
  }, [yearStart, yearEnd])

  const setLayerVisible = (name, visible) => {
    const layer = overlaysRef.current[name]
    if (!layer) return
    if (visible) mapRef.current.addLayer(layer)
    else mapRef.current.removeLayer(layer)
    setActiveLayers(prev => ({ ...prev, [name]: visible }))
  }

  const search = q => {
    q = q.trim().toLowerCase()
    if (!q) return
    const match = searchIndexRef.current.find(({ feature }) =>
      Object.values(feature.properties || {}).some(v =>
        String(v).toLowerCase().includes(q),
      ),
    )
    if (match) {
      const tmp = L.geoJSON(match.feature)
      tmp.bindPopup(popupTable(match.feature.properties || {}))
      tmp.addTo(mapRef.current)
      mapRef.current.fitBounds(tmp.getBounds().pad(0.25))
      tmp.openPopup()
      setTimeout(() => mapRef.current.removeLayer(tmp), 5000)
    }
  }

  const applyPreset = ({ layers, range }) => {
    Object.keys(overlaysRef.current).forEach(name => {
      setLayerVisible(name, layers.includes(name))
    })
    if (range) {
      setYearStart(range[0])
      setYearEnd(range[1])
    }
  }

  const value = {
    activeLayers,
    setLayerVisible,
    yearStart,
    yearEnd,
    setYearStart,
    setYearEnd,
    eras,
    eraColors,
    search,
    applyPreset,
    basemap,
    setBasemap,
    basemapOptions: Object.keys(basemapLayers),
  }

  return (
    <MapContext.Provider value={value}>
      <div id="map"></div>
      {children}
    </MapContext.Provider>
  )
}

export const useMapContext = () => useContext(MapContext)
