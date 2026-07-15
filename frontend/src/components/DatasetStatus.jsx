function DatasetStatus() {
  return (
    <div className="dataset-summary-card">
      <h3 className="summary-title">Dataset Status</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#475569' }}>
          Upload - <span style={{ color: '#10b981', fontWeight: 600 }}>Complete</span>
        </p>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#475569' }}>
          Analysis - <span style={{ color: '#10b981', fontWeight: 600 }}>Ready</span>
        </p>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#475569' }}>
          Queries - <span style={{ color: '#10b981', fontWeight: 600 }}>Available</span>
        </p>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#475569' }}>
          Reports - <span style={{ color: '#10b981', fontWeight: 600 }}>Ready</span>
        </p>
      </div>
    </div>
  )
}

export default DatasetStatus;
