function TopProductsChart({ items, isLoading }) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="card-title">Top Products by Revenue</h3>
        <p className="muted-text">Loading top products...</p>
      </div>
    )
  }

  if (!items?.length) {
    return (
      <div className="card">
        <h3 className="card-title">Top Products by Revenue</h3>
        <p className="muted-text">No product data available.</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...items.map((p) => p.revenue || 0)) || 1

  return (
    <div className="card">
      <h3 className="card-title">Top Products by Revenue</h3>
      <div className="chart-horizontal">
        {items.map((item) => {
          const width = (item.revenue / maxRevenue) * 100
          return (
            <div key={item.product} className="chart-row">
              <span className="chart-label">{item.product}</span>
              <div className="chart-bar-wrapper">
                <div className="chart-bar-horizontal" style={{ width: `${width}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TopProductsChart
