function RegionPerformanceChart({ regions, isLoading }) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="card-title">Revenue by Region</h3>
        <p className="muted-text">Loading regions...</p>
      </div>
    )
  }

  if (!regions?.length) {
    return (
      <div className="card">
        <h3 className="card-title">Revenue by Region</h3>
        <p className="muted-text">No regional data available.</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...regions.map((r) => r.revenue || 0)) || 1

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Revenue by Region</h3>
          <p className="card-subtitle">Comparative performance</p>
        </div>
      </div>
      <div className="chart-horizontal">
        {regions.map((region, idx) => {
          const width = (region.revenue / maxRevenue) * 100
          return (
            <div key={region.region} className="chart-row">
              <span className="chart-label">{region.region}</span>
              <div className="chart-bar-wrapper">
                <div className="chart-bar-horizontal region" style={{ width: `${width}%` }} title={`${region.region}: $${region.revenue}`} />
              </div>
              <span className="chart-value">${region.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RegionPerformanceChart
