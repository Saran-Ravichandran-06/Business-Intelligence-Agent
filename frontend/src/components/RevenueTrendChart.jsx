function RevenueTrendChart({ points, isLoading }) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="card-title">Revenue Trend</h3>
        <p className="muted-text">Loading trend...</p>
      </div>
    )
  }

  if (!points?.length) {
    return (
      <div className="card">
        <h3 className="card-title">Revenue Trend</h3>
        <p className="muted-text">No trend data available.</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...points.map((p) => p.revenue || 0)) || 1

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Revenue Trend</h3>
          <p className="card-subtitle">7-day rolling average</p>
        </div>
      </div>
      <div className="chart">
        {points.map((point) => {
          const height = (point.revenue / maxRevenue) * 100
          return (
            <div key={point.date} className="chart-column">
              <div className="chart-bar" style={{ height: `${height}%` }} title={`${point.date}: $${point.revenue}`} />
              <span className="chart-label">{point.date}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RevenueTrendChart
