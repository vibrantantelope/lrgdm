import { useState, useRef } from 'react'
import LayerToggles from './LayerToggles'
import YearRange from './YearRange'
import Search from './Search'
import EraChips from './EraChips'
import BasemapSelector from './BasemapSelector'
import DataUpdated from './DataUpdated'
import EraLegend from './EraLegend'

const TABS = ['Explore', 'Layers', 'Filters', 'Styles', 'Legend']

export default function BottomSheet() {
  const [open, setOpen] = useState(false)
  const [height, setHeight] = useState(() => window.innerHeight / 3)
  const [activeTab, setActiveTab] = useState('Layers')
  const dragStart = useRef(0)

  const startDrag = e => {
    dragStart.current = e.touches ? e.touches[0].clientY : e.clientY
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', endDrag)
    document.addEventListener('touchmove', onDrag)
    document.addEventListener('touchend', endDrag)
  }

  const onDrag = e => {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const delta = dragStart.current - clientY
    dragStart.current = clientY
    setHeight(h => {
      const nh = Math.min(window.innerHeight, Math.max(100, h + delta))
      return nh
    })
  }

  const endDrag = () => {
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', endDrag)
    document.removeEventListener('touchmove', onDrag)
    document.removeEventListener('touchend', endDrag)
  }

  return (
    <>
      <button className="layers-button" onClick={() => setOpen(true)}>
        Layers
      </button>
      {open && (
        <div className="bottom-sheet" style={{ height }}>
          <div
            className="drag-handle"
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          />
          <div className="tabs">
            {TABS.map(tab => (
              <button
                key={tab}
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="tab-content">
            {activeTab === 'Explore' && <p>Preset options coming soon.</p>}
            {activeTab === 'Layers' && <LayerToggles />}
            {activeTab === 'Filters' && (
              <>
                <Search />
                <YearRange />
                <EraChips />
              </>
            )}
            {activeTab === 'Styles' && <BasemapSelector />}
            {activeTab === 'Legend' && (
              <>
                <DataUpdated />
                <EraLegend />
              </>
            )}
          </div>
          <button className="close-button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      )}
    </>
  )
}
