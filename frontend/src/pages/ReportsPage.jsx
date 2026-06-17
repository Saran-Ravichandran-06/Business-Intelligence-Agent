import { useMemo, useState } from 'react'
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
import {
  generateReport,
  getReportDownloadCsvUrl,
  getReportDownloadPdfUrl,
} from '../services/api'

const REPORT_TYPES = [
  { id: 'monthly', label: 'Monthly Report' },
  { id: 'quarterly', label: 'Quarterly Report' },
  { id: 'full_dataset', label: 'Full Dataset Report' },
]

function formatDate(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString()
}

function chartRows(chart) {
  const labels = chart?.labels || []
  const values = chart?.values || []
  return labels.map((label, i) => ({ label, value: values[i] }))
}

function ReportsPage() {
  const [reportType, setReportType] = useState('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const selected = useMemo(
    () => history.find((r) => r.id === selectedId) || history[0] || null,
    [history, selectedId],
  )

  const onGenerate = async () => {
    setIsLoading(true)
    setError('')
    try {
      const report = await generateReport(reportType)
      const item = { id: crypto.randomUUID(), ...report }
      setHistory((prev) => [item, ...prev])
      setSelectedId(item.id)
    } catch (err) {
      setError(err?.message || 'Failed to generate report.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="workspace">
      <h2>Reports</h2>
      <p className="muted-text">Generate, preview, and export business reports.</p>

      <div className="workspace-grid">
        <div className="workspace-left">
          <div className="card">
            <h3 className="card-title">Generate Business Reports</h3>
            <div className="suggestions">
              {REPORT_TYPES.map((type) => (
                <label key={type.id} className="suggestion-btn">
                  <input
                    type="radio"
                    name="reportType"
                    value={type.id}
                    checked={reportType === type.id}
                    onChange={() => setReportType(type.id)}
                  />{' '}
                  {type.label}
                </label>
              ))}
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={onGenerate}
              disabled={isLoading}
              style={{ marginTop: 12 }}
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>

          <div className="card">
            <h3 className="card-title">Report History</h3>
            {history.length === 0 ? (
              <p className="muted-text">No reports generated this session.</p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`history-item ${selected?.id === item.id ? 'history-item-active' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <strong>{item.report_type}</strong>
                    <span>Generated: {formatDate(item.generated_at)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="workspace-right">
          {!selected ? (
            <div className="card">
              <p className="muted-text">Generate a report to see preview.</p>
            </div>
          ) : (
            <>
              <div className="card">
                <h3 className="card-title">Report Preview</h3>
                <p className="muted-text">Generated: {formatDate(selected.generated_at)}</p>
                <p>{selected.summary}</p>
              </div>

              <div className="card">
                <h3 className="card-title">Key KPIs</h3>
                <div className="findings-grid">
                  {Object.entries(selected.kpis || {}).map(([k, v]) => (
                    <div key={k} className="finding-card">
                      <p className="label">{k.replaceAll('_', ' ')}</p>
                      <p className="finding-value">
                        {typeof v === 'number' ? v.toLocaleString() : String(v ?? 'N/A')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="card-title">Important Insights</h3>
                <ul>
                  {(selected.insights || []).map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h3 className="card-title">Charts</h3>
                <div className="stack">
                  {(selected.charts || []).map((chart, idx) => {
                    const rows = chartRows(chart)
                    return (
                      <div key={idx} style={{ width: '100%', height: 260 }}>
                        <p className="label">{chart.title}</p>
                        <ResponsiveContainer>
                          {chart.chart_type === 'line' ? (
                            <LineChart data={rows}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} />
                            </LineChart>
                          ) : (
                            <BarChart data={rows}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#2563eb" />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card">
                <h3 className="card-title">Export Options</h3>
                <div className="row">
                  <a className="primary-button" href={getReportDownloadPdfUrl()} target="_blank" rel="noreferrer">
                    Download PDF
                  </a>
                  <a className="secondary-button" href={getReportDownloadCsvUrl()} target="_blank" rel="noreferrer">
                    Download CSV Summary
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
    </section>
  )
}

export default ReportsPage
