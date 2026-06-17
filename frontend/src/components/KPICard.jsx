function KPICard({ label, value, secondary }) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value ?? '—'}</p>
      {secondary ? <p className="kpi-secondary">{secondary}</p> : null}
    </div>
  )
}

export default KPICard
