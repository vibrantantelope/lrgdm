import Sidebar from './components/Sidebar'
import { MapProvider } from './MapContext'

export default function App() {
  return (
    <MapProvider>
      <Sidebar />
    </MapProvider>
  )
}
