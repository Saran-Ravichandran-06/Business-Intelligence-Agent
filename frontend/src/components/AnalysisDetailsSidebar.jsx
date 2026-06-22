function AnalysisDetailsSidebar({ analysis, confidence }) {
  if (!analysis) {
    return (
      <div className="agent-sidebar-right">
        <div className="sidebar-empty-state">
          <p className="empty-text">Submit a query to see analysis details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="agent-sidebar-right">
      <h3 className="sidebar-title">Analysis Details</h3>

      <div className="details-items">
        <div className="detail-item">
          <p className="detail-label">Analysis Type</p>
          <p className="detail-value">
            {analysis.analysis_type || '—'}
          </p>
        </div>

        <div className="detail-item">
          <p className="detail-label">Primary Metric</p>
          <p className="detail-value">
            {analysis.metric || '—'}
          </p>
        </div>

        <div className="detail-item">
          <p className="detail-label">Time Period</p>
          <p className="detail-value">
            {analysis.time_period || '—'}
          </p>
        </div>

        {analysis.comparison_target && (
          <div className="detail-item">
            <p className="detail-label">Comparison</p>
            <p className="detail-value">
              {analysis.comparison_target}
            </p>
          </div>
        )}

        <div className="detail-item">
          <p className="detail-label">Confidence</p>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${confidence || 75}%` }}
            ></div>
          </div>
          <p className="confidence-text">{confidence || 75}% confident</p>
        </div>
      </div>
    </div>
  )
}

export default AnalysisDetailsSidebar
