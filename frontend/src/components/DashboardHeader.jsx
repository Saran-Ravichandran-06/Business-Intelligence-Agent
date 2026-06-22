import { useEffect, useState } from 'react'

function DashboardHeader({ dataset, isLoading }) {
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    setLastUpdated(new Date())
  }, [dataset])

  const formatTime = (date) => {
    if (!date) return ''
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="dashboard-header">
      <div className="dashboard-header-top">
        <div className="dashboard-title-section">
          <h1 className="dashboard-title">Analytics Dashboard</h1>
          <p className="dashboard-subtitle">Real-time business intelligence from your data</p>
        </div>
        <div className="dashboard-meta">
          {dataset && (
            <>
              <div className="dataset-badge">
                <span className="badge-icon">📊</span>
                <span className="badge-text">{dataset.file_name}</span>
              </div>
              <div className="last-updated">
                <span className="updated-label">Last updated</span>
                <span className="updated-time">{formatTime(lastUpdated)}</span>
              </div>
            </>
          )}
          <div className="health-indicator">
            <span className="health-dot healthy"></span>
            <span className="health-text">Healthy</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardHeader
