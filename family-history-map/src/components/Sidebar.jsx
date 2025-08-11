import { useState } from 'react'
import LayerToggles from './LayerToggles'
import YearRange from './YearRange'
import Search from './Search'
import EraChips from './EraChips'
import BasemapSelector from './BasemapSelector'

function MenuIcon({ open }) {
  return (
    <span aria-hidden="true">{open ? '×' : '☰'}</span>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        id="navToggle"
        aria-controls="sidebar"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen(o => !o)}
      >
        <MenuIcon open={open} />
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
