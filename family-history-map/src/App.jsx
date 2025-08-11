import BottomSheet from './components/BottomSheet'
import { MapProvider } from './MapContext'

export default function App() {
  return (
    <MapProvider>
      <BottomSheet />
    </MapProvider>
  )
}

