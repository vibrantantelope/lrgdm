import { useEffect } from 'react'
import L from 'leaflet'

function App() {
  useEffect(() => {
    const map = L.map('map').setView([0, 0], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
  }, [])

  return <div id="map"></div>
}

export default App
