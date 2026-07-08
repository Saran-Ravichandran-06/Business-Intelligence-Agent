function ReportBuilder({ onGenerate, isLoading, reportType, onTypeChange }) {
  const reportTypes = [
    {
      id: 'monthly',
      label: 'Monthly Report',
      description: 'Last 30 days of business performance',
      icon: '📅',
    },
    {
      id: 'quarterly',
      label: 'Quarterly Report',
      description: 'Complete quarterly analysis',
      icon: '📊',
    },
    {
      id: 'full_dataset',
      label: 'Full Business Review',
      description: 'Entire dataset analysis',
      icon: '📈',
    },
  ]

  return (
    <div className="report-builder-panel">
      <div className="builder-header">
        <h3 className="builder-title">Report Builder</h3>
        <p className="builder-subtitle">Create executive reports instantly</p>
      </div>

      <div className="report-types-grid">
        {reportTypes.map((type) => (
          <button
            key={type.id}
            className={`report-type-card ${reportType === type.id ? 'active' : ''}`}
            onClick={() => onTypeChange(type.id)}
          >
            <span className="type-icon">{type.icon}</span>
            <div className="type-content">
              <h4 className="type-label">{type.label}</h4>
              <p className="type-description">{type.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="report-options">
        <h4 className="options-title">Report Options</h4>
        <div className="option-item">
          <input
            type="checkbox"
            id="include-charts"
            defaultChecked={true}
          />
          <label htmlFor="include-charts">Include Charts</label>
        </div>
        <div className="option-item">
          <input
            type="checkbox"
            id="include-insights"
            defaultChecked={true}
          />
          <label htmlFor="include-insights">Include AI Insights</label>
        </div>
        <div className="option-item">
          <input
            type="checkbox"
            id="include-forecast"
            defaultChecked={true}
          />
          <label htmlFor="include-forecast">Include Forecast</label>
        </div>
      </div>

      <button
        className="generate-button"
        onClick={onGenerate}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner">⏳</span>
            Generating Report...
          </>
        ) : (
          <>
            <span className="icon">📄</span>
            Generate Report
          </>
        )}
      </button>
    </div>
  )
}

export default ReportBuilder
