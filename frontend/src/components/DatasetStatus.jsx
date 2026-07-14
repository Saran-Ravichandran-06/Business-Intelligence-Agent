function DatasetStatus() {
  return (
    <div className="dataset-summary-card">
      <h3 className="summary-title">Dataset Status</h3>
      
      <div className="summary-features">
        <div className="feature-item">
          <span className="feature-icon">✓</span>
          <div className="feature-content">
            <p className="feature-label">Upload</p>
            <p className="feature-status detected">Complete</p>
          </div>
        </div>
        
        <div className="feature-item">
          <span className="feature-icon">✓</span>
          <div className="feature-content">
            <p className="feature-label">Analysis</p>
            <p className="feature-status detected">Ready</p>
          </div>
        </div>
      </div>
      
      <div className="summary-features" style={{ marginTop: '1rem' }}>
        <div className="feature-item">
          <span className="feature-icon">✓</span>
          <div className="feature-content">
            <p className="feature-label">Queries</p>
            <p className="feature-status detected">Available</p>
          </div>
        </div>
        
        <div className="feature-item">
          <span className="feature-icon">✓</span>
          <div className="feature-content">
            <p className="feature-label">Reports</p>
            <p className="feature-status detected">Ready</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatasetStatus;
