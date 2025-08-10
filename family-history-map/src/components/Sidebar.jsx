import { useState } from 'react'
import LayerToggles from './LayerToggles'
import YearRange from './YearRange'
import Search from './Search'
import EraChips from './EraChips'
import BasemapSelector from './BasemapSelector'

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        id="navToggle"
        aria-controls="sidebar"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        ☰
      </button>
      <div id="sidebar" className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <Search />
        <BasemapSelector />
        <YearRange />
        <LayerToggles />
        <EraChips />
      </div>
    </>
  )
}
