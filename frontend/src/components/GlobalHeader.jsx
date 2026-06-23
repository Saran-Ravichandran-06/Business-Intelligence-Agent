import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const pageConfig = {
  '/': {
    title: 'Analytics Dashboard',
    description: 'Overview of your business performance and key metrics',
    icon: '📊',
  },
  '/upload': {
    title: 'Upload Dataset',
    description: 'Import and manage your business data',
    icon: '📁',
  },
  '/ask-agent': {
    title: 'Ask Agent',
    description: 'Query your data using natural language',
    icon: '💬',
  },
  '/reports': {
    title: 'Reports',
    description: 'Generate and export business reports',
    icon: '📈',
  },
}

function GlobalHeader() {
  const location = useLocation()
  const config = pageConfig[location.pathname] || pageConfig['/']
  const [datasetInfo, setDatasetInfo] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    // Simulate fetching dataset info
    const storedDataset = localStorage.getItem('currentDataset')
    if (storedDataset) {
      try {
        const data = JSON.parse(storedDataset)
        setDatasetInfo(data)
        setLastUpdated(new Date())
      } catch (err) {
        // Invalid JSON, ignore
      }
    }
  }, [])

  const formatTime = (date) => {
    if (!date) return null
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <header className="global-header">
      <div className="header-content">
        <div className="header-title-section">
          <div className="header-icon">{config.icon}</div>
          <div>
            <h1 className="header-title">{config.title}</h1>
            <p className="header-description">{config.description}</p>
          </div>
        </div>

        <div className="header-right">
          {datasetInfo && (
            <div className="dataset-badge">
              <span className="badge-icon">📊</span>
              <div className="badge-info">
                <p className="badge-name">{datasetInfo.name || 'Dataset'}</p>
                <p className="badge-meta">
                  {datasetInfo.rows || 0} rows • {datasetInfo.columns || 0} columns
                </p>
              </div>
            </div>
          )}

          {lastUpdated && (
            <div className="last-updated">
              <p className="update-label">Updated</p>
              <p className="update-time">{formatTime(lastUpdated)}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default GlobalHeader
