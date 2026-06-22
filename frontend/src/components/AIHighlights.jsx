function AIHighlights({ regions, topProducts, isLoading }) {
  if (isLoading) {
    return (
      <div className="ai-highlights-card">
        <div className="ai-highlights-header">
          <h3 className="ai-highlights-title">✨ AI Highlights</h3>
        </div>
        <p className="muted-text">Loading insights...</p>
      </div>
    )
  }

  const topRegion = regions && regions.length > 0 ? regions[0] : null
  const topProduct = topProducts && topProducts.length > 0 ? topProducts[0] : null

  return (
    <div className="ai-highlights-card">
      <div className="ai-highlights-header">
        <h3 className="ai-highlights-title">✨ AI Highlights</h3>
      </div>

      <div className="ai-highlights-content">
        {topRegion && (
          <div className="ai-highlight-item">
            <p className="ai-highlight-label">Top Performing Region</p>
            <p className="ai-highlight-value">{topRegion.region}</p>
            <p className="ai-highlight-stat">
              ${topRegion.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue
            </p>
          </div>
        )}

        {topProduct && (
          <div className="ai-highlight-item">
            <p className="ai-highlight-label">Top Product</p>
            <p className="ai-highlight-value">{topProduct.product}</p>
            <p className="ai-highlight-stat">
              ${topProduct.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue
            </p>
          </div>
        )}

        <div className="ai-highlight-item">
          <p className="ai-highlight-label">Key Observation</p>
          <p className="ai-highlight-observation">
            {topRegion && topProduct
              ? `${topRegion.region} leads with ${topProduct.product} as the top performer.`
              : 'Analyze your data to discover key patterns and insights.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AIHighlights
