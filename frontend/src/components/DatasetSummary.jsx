function DatasetSummary({ dataset }) {
  if (!dataset) return null

  return (
    <div className="dataset-summary-card">
      <h3 className="summary-title">Dataset Summary</h3>
      
      <div className="summary-grid">
        <div className="summary-item">
          <p className="summary-label">Total Rows</p>
          <p className="summary-value">{dataset.row_count ?? dataset.rows ?? '—'}</p>
        </div>
        
        <div className="summary-item">
          <p className="summary-label">Columns</p>
          <p className="summary-value">{dataset.column_count ?? dataset.columns ?? '—'}</p>
        </div>
      </div>

      <div className="summary-features">
        <div className="feature-item">
          <div className="feature-content">
            <p className="feature-label">Date/Time Column</p>
            <p className="feature-status detected">Detected</p>
          </div>
        </div>
        
        <div className="feature-item">
          <div className="feature-content">
            <p className="feature-label">Numeric Features</p>
            <p className="feature-status detected">Detected</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatasetSummary
