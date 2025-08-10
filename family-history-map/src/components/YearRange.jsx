import { useMapContext } from '../MapContext'

export default function YearRange() {
  const { yearStart, yearEnd, setYearStart, setYearEnd } = useMapContext()
  return (
    <div style={{ marginTop: 6 }}>
      <label>
        Years: <span>{yearStart} - {yearEnd}</span>
      </label>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          type="range"
          id="yearStart"
          min="1600"
          max="2020"
          value={yearStart}
          onChange={e => setYearStart(+e.target.value)}
          style={{ flex: 1 }}
        />
        <input
          type="range"
          id="yearEnd"
          min="1600"
          max="2020"
          value={yearEnd}
          onChange={e => setYearEnd(+e.target.value)}
          style={{ flex: 1 }}
        />
      </div>
    </div>
  )
}
