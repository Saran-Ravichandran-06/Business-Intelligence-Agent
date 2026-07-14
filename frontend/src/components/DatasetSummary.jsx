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

      <div className="summary-divider"></div>

      <div className="summary-features">
        <div className="feature-item">
          <span className="feature-icon">📊</span>
          <div className="feature-content">
            <p className="feature-label">Revenue Column</p>
            <p className="feature-status detected">Detected</p>
          </div>
        </div>
        
        <div className="feature-item">
          <span className="feature-icon">📈</span>
          <div className="feature-content">
            <p className="feature-label">Profit Column</p>
            <p className="feature-status detected">Detected</p>
          </div>
        </div>
      </div>

      <div className="summary-divider"></div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
          <strong>Upload</strong> - <span style={{ color: '#10b981', fontWeight: 500 }}>Complete</span>
        </p>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
          <strong>Analysis</strong> - <span style={{ color: '#10b981', fontWeight: 500 }}>Ready</span>
        </p>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
          <strong>Queries</strong> - <span style={{ color: '#10b981', fontWeight: 500 }}>Available</span>
        </p>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
          <strong>Reports</strong> - <span style={{ color: '#10b981', fontWeight: 500 }}>Ready</span>
        </p>
      </div>
    </div>
  )
}

export default DatasetSummary
