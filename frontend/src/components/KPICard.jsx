function KPICard({ label, value, secondary, trend, trendPositive, subtext }) {
  return (
    <div className="kpi-card-premium">
      <div className="kpi-card-header">
        <p className="kpi-label">{label}</p>
      </div>
      <p className="kpi-value-large">{value ?? '—'}</p>
      {trend !== undefined && (
        <div className={`kpi-trend ${trendPositive ? 'positive' : 'negative'}`}>
          <span className="trend-icon">{trendPositive ? '↑' : '↓'}</span>
          <span className="trend-value">{Math.abs(trend)}%</span>
          <span className="trend-text">vs last month</span>
        </div>
      )}
      {subtext && <p className="kpi-subtext">{subtext}</p>}
      {secondary ? <p className="kpi-secondary">{secondary}</p> : null}
    </div>
  )
}

export default KPICard
