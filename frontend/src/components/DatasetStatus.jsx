function DatasetStatus({ dataset, isLoading }) {
  const isReady = !!dataset

  return (
    <div className="dataset-status-sidebar">
      <h3 className="status-title">Status</h3>

      <div className="status-list">
        <div className="status-item">
          <div className={`status-icon ${isReady ? 'complete' : 'pending'}`}>
            {isReady ? '✓' : '○'}
          </div>
          <div className="status-content">
            <p className="status-label">Upload</p>
            <p className="status-description">{isReady ? 'Complete' : 'Pending'}</p>
          </div>
        </div>

        <div className="status-item">
          <div className={`status-icon ${isReady ? 'complete' : 'pending'}`}>
            {isReady ? '✓' : '○'}
          </div>
          <div className="status-content">
            <p className="status-label">Analysis</p>
            <p className="status-description">{isReady ? 'Ready' : 'Waiting'}</p>
          </div>
        </div>

        <div className="status-item">
          <div className={`status-icon ${isReady ? 'complete' : 'pending'}`}>
            {isReady ? '✓' : '○'}
          </div>
          <div className="status-content">
            <p className="status-label">Queries</p>
            <p className="status-description">{isReady ? 'Available' : 'Waiting'}</p>
          </div>
        </div>

        <div className="status-item">
          <div className={`status-icon ${isReady ? 'complete' : 'pending'}`}>
            {isReady ? '✓' : '○'}
          </div>
          <div className="status-content">
            <p className="status-label">Reports</p>
            <p className="status-description">{isReady ? 'Ready' : 'Waiting'}</p>
          </div>
        </div>
      </div>

      {isReady && (
        <>
          <div className="status-divider"></div>
          <div className="status-info">
            <p className="info-icon">💡</p>
            <p className="info-text">Your dataset is ready for analysis. Navigate to Dashboard to explore.</p>
          </div>
        </>
      )}
    </div>
  )
}

export default DatasetStatus
