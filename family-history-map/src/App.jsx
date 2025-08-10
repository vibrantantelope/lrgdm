import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet-arrowheads'

const YEAR_START = 1600
const YEAR_END = 2020

const STYLE = {
  people: { radius: 6, color: '#0A84FF' },
  places: { radius: 6, color: '#2ed573' },
  births: { radius: 6, color: '#1f77ff' },
  deaths: { radius: 6, color: '#e43f3f' },
  events: { color: '#ff6b6b', weight: 2, opacity: 0.9 },
  lines: { weight: 2.5, opacity: 0.95 },
  eraColors: {
    'Early Republic': '#d9534f',
    'Gilded Age': '#f0ad4e',
    'Colonial Era': '#5cb85c',
    'Civil War & Reconstruction': '#5bc0de',
    'Progressive Era & WWI': '#337ab7',
    'Roaring 20s & Great Depression': '#8e44ad',
  },
}

function App() {
  useEffect(() => {
    const map = L.map('map').setView([0, 0], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const overlays = {}

    let fitted = false
    function fitIfNeeded() {
      if (fitted) return
      let bounds = null
      Object.values(overlays).forEach((layer) => {
        if (!map.hasLayer(layer)) return
        try {
          const b = layer.getBounds ? layer.getBounds() : L.featureGroup([layer]).getBounds()
          if (b && b.isValid()) bounds = bounds ? bounds.extend(b) : b
        } catch {
          // ignore errors computing bounds
        }
      })
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds.pad(0.15))
        fitted = true
      }
    }

    // People
    fetch('/data/people.geojson')
      .then((r) => r.json())
      .then((data) => {
        const cluster = L.markerClusterGroup()
        const layer = L.geoJSON(data, {
          filter: (f) => {
            const y = f.properties?.birth_year || f.properties?.death_year
            return !y || (y >= YEAR_START && y <= YEAR_END)
          },
          pointToLayer: (f, latlng) =>
            L.circleMarker(latlng, {
              radius: STYLE.people.radius,
              color: STYLE.people.color,
              weight: 1,
              fillOpacity: 0.85,
            }),
        })
        cluster.addLayer(layer)
        cluster.addTo(map)
        overlays['People'] = cluster
        fitIfNeeded()
      })

    // Places
    fetch('/data/places.geojson')
      .then((r) => r.json())
      .then((data) => {
        const layer = L.geoJSON(data, {
          pointToLayer: (f, latlng) =>
            L.circleMarker(latlng, {
              radius: STYLE.places.radius,
              color: STYLE.places.color,
              weight: 1,
              fillOpacity: 0.6,
            }),
          style: () => ({
            color: STYLE.places.color,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.2,
          }),
        })
        layer.addTo(map)
        overlays['Places'] = layer
        fitIfNeeded()
      })

    // Events
    fetch('/data/events.geojson')
      .then((r) => r.json())
      .then((data) => {
        const layer = L.geoJSON([], {
          pointToLayer: (f, latlng) =>
            L.circleMarker(latlng, { radius: 6, color: '#b30000', weight: 1, fillOpacity: 0.9 }),
          style: () => ({ ...STYLE.events }),
        })
        const feats = (data.features || []).filter((f) => {
          const y = f.properties?.event_year
          return !y || (y >= YEAR_START && y <= YEAR_END)
        })
        layer.addData({ type: 'FeatureCollection', features: feats })
        layer.addTo(map)
        overlays['Events'] = layer
        fitIfNeeded()
      })

    // Birth Points
    fetch('/data/birth_location_points.geojson')
      .then((r) => r.json())
      .then((data) => {
        const layer = L.geoJSON([], {
          pointToLayer: (f, latlng) =>
            L.circleMarker(latlng, {
              radius: STYLE.births.radius,
              color: STYLE.births.color,
              weight: 1,
              fillOpacity: 0.9,
            }),
        })
        const feats = (data.features || []).filter((f) => {
          const y = f.properties?.birth_year
          return !y || (y >= YEAR_START && y <= YEAR_END)
        })
        layer.addData({ type: 'FeatureCollection', features: feats })
        layer.addTo(map)
        overlays['Birth Points'] = layer
        fitIfNeeded()
      })

    // Death Points
    fetch('/data/death_location_points.geojson')
      .then((r) => r.json())
      .then((data) => {
        const layer = L.geoJSON([], {
          pointToLayer: (f, latlng) =>
            L.circleMarker(latlng, {
              radius: STYLE.deaths.radius,
              color: STYLE.deaths.color,
              weight: 1,
              fillOpacity: 0.9,
            }),
        })
        const feats = (data.features || []).filter((f) => {
          const y = f.properties?.death_year
          return !y || (y >= YEAR_START && y <= YEAR_END)
        })
        layer.addData({ type: 'FeatureCollection', features: feats })
        layer.addTo(map)
        overlays['Death Points'] = layer
        fitIfNeeded()
      })

    // Birth→Death Lines
    fetch('/data/birth_to_death_lines_eras.geojson')
      .then((r) => r.json())
      .then((data) => {
        const layer = L.geoJSON([], {
          style: (f) => ({
            color: STYLE.eraColors[f.properties?.era] || '#3388ff',
            weight: STYLE.lines.weight,
            opacity: STYLE.lines.opacity,
          }),
        })
        const feats = (data.features || []).filter((f) => {
          const p = f.properties || {}
          const y = p.birth_year || p.death_year
          return !y || (y >= YEAR_START && y <= YEAR_END)
        })
        layer.addData({ type: 'FeatureCollection', features: feats })
        layer.eachLayer((l) => {
          if (l.arrowheads) l.arrowheads({ frequency: 'end', size: '15px' })
        })
        layer.addTo(map)
        overlays['Birth→Death Lines'] = layer
        fitIfNeeded()
      })
  }, [])

  return <div id="map"></div>
}

export default App
