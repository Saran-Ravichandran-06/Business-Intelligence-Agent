import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatDate(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString()
}

function chartRows(chart) {
  const labels = chart?.labels || []
  const values = chart?.values || []
  return labels.map((label, i) => ({ label, value: values[i] }))
}

function ReportPreview({ report, isLoading }) {
  if (isLoading) {
    return (
      <div className="report-preview-panel">
        <div className="preview-loading">
          <div className="loading-spinner">⏳</div>
          <p>Generating your report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="report-preview-panel">
        <div className="preview-empty">
          <p className="empty-icon">📄</p>
          <p className="empty-title">No Report Generated</p>
          <p className="empty-text">Generate a report to see the preview here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="report-preview-panel">
      {/* Executive Summary */}
      <div className="preview-section executive-summary">
        <div className="section-header">
          <h3 className="section-title">Executive Summary</h3>
          <p className="generated-at">
            Generated {formatDate(report.generated_at)}
          </p>
        </div>
        <p className="summary-text">{report.summary}</p>
      </div>

      {/* Key KPIs */}
      <div className="preview-section kpi-section">
        <h3 className="section-title">Key Performance Indicators</h3>
        <div className="kpi-grid">
          {Object.entries(report.kpis || {})
            .slice(0, 4)
            .map(([key, value]) => (
              <div key={key} className="kpi-preview-card">
                <p className="kpi-label">{key.replace(/_/g, ' ')}</p>
                <p className="kpi-preview-value">
                  {typeof value === 'number'
                    ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                    : String(value ?? 'N/A')}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Charts */}
      {(report.charts || []).length > 0 && (
        <div className="preview-section charts-section">
          <h3 className="section-title">Performance Charts</h3>
          <div className="charts-container">
            {(report.charts || [])
              .slice(0, 2)
              .map((chart, idx) => {
                const rows = chartRows(chart)
                return (
                  <div key={idx} className="chart-preview">
                    <p className="chart-title">{chart.title}</p>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={200}>
                        {chart.chart_type === 'line' ? (
                          <LineChart data={rows}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ fill: '#10b981', r: 3 }}
                            />
                          </LineChart>
                        ) : (
                          <BarChart data={rows}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Insights */}
      {(report.insights || []).length > 0 && (
        <div className="preview-section insights-section">
          <h3 className="section-title">AI Insights</h3>
          <ul className="insights-list">
            {(report.insights || []).map((insight, idx) => (
              <li key={idx} className="insight-item">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Forecasts */}
      {(report.forecasts || []).length > 0 && (
        <div className="preview-section forecast-section">
          <h3 className="section-title">Forecasts</h3>
          <ul className="insights-list">
            {(report.forecasts || []).map((fc, idx) => (
              <li key={idx} className="insight-item">
                {fc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export Actions */}
      <div className="preview-section export-section">
        <h3 className="section-title">Export Report</h3>
        <div className="export-buttons">
          <button className="export-btn pdf-btn">
            <span>📥</span> Download PDF
          </button>
          <button className="export-btn csv-btn">
            <span>📊</span> Download CSV
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportPreview
