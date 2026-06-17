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
import { runAgentQuery } from '../services/api'

const SUGGESTIONS = [
  'Show revenue trend',
  'Compare North and South sales',
  'Why did revenue drop in March?',
  "Predict next month's revenue",
]

function formatValue(value) {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
  return String(value)
}

function getChartRows(visualizationData) {
  const labels = visualizationData?.labels || []
  const dataset = visualizationData?.datasets?.[0]
  const values = dataset?.values || []
  return labels.map((label, i) => ({ label, value: values[i] }))
}

function AskAgentPage() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('Ready')
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading])
  const selected = useMemo(
    () => history.find((h) => h.id === selectedId) || history[0] || null,
    [history, selectedId],
  )

  const submitQuery = async (rawQuery) => {
    const query = rawQuery.trim()
    if (!query || isLoading) return

    setIsLoading(true)
    setLoadingStage('Running BI pipeline...')
    setError('')
    setInput('')

    try {
      const response = await runAgentQuery(query)
      const item = {
        id: crypto.randomUUID(),
        query,
        timestamp: new Date().toISOString(),
        ...response,
      }
      setHistory((prev) => [item, ...prev])
      setSelectedId(item.id)
    } catch (err) {
      setError(err?.message || 'Agent failed to analyze the query.')
    } finally {
      setIsLoading(false)
      setLoadingStage('Ready')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitQuery(input)
    }
  }

  const handleCopyInsight = async () => {
    if (!selected?.insight) return
    await navigator.clipboard.writeText(selected.insight)
  }

  const visualizationRows = getChartRows(selected?.visualization_data)
  const chartType = selected?.visualization_data?.chart_type
  const queryAnalysis = selected?.query_analysis
  const analyticsResults = selected?.analytics_results

  return (
    <section className="workspace">
      <h2>Business Intelligence Workspace</h2>
      <p className="muted-text">Query → Understanding → Analytics → Insight</p>

      <div className="workspace-grid">
        <div className="workspace-left">
          <div className="card">
            <h3 className="card-title">Query Input</h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a business question..."
              rows={4}
              disabled={isLoading}
            />
            <div className="row" style={{ marginTop: 10 }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => submitQuery(input)}
                disabled={!canSend}
              >
                {isLoading ? 'Processing...' : 'Submit Query'}
              </button>
              <span className="muted-text">Status: {loadingStage}</span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Example Queries</h3>
            <div className="suggestions">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="suggestion-btn"
                  onClick={() => submitQuery(q)}
                  disabled={isLoading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Query History (Session)</h3>
            {history.length === 0 ? (
              <p className="muted-text">No queries yet.</p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`history-item ${selected?.id === item.id ? 'history-item-active' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <strong>{item.query}</strong>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="workspace-right">
          {!selected ? (
            <div className="card">
              <p className="muted-text">Submit a query to view analysis panels.</p>
            </div>
          ) : (
            <>
              <div className="card">
                <h3 className="card-title">Query Understanding Panel</h3>
                <div className="grid-2">
                  <p><strong>Analysis Type:</strong> {queryAnalysis?.analysis_type || 'unknown'}</p>
                  <p><strong>Metric:</strong> {queryAnalysis?.metric || 'null'}</p>
                  <p><strong>Time Period:</strong> {queryAnalysis?.time_period || 'null'}</p>
                  <p><strong>Comparison Target:</strong> {queryAnalysis?.comparison_target || 'null'}</p>
                </div>
              </div>

              <div className="card">
                <h3 className="card-title">Analytics Findings Panel</h3>
                {selected.error ? (
                  <p className="error-text">{selected.error}</p>
                ) : analyticsResults ? (
                  <div className="findings-grid">
                    {Object.entries(analyticsResults).map(([k, v]) => (
                      <div key={k} className="finding-card">
                        <p className="label">{k.replaceAll('_', ' ')}</p>
                        <p className="finding-value">{formatValue(v)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-text">No analytics data.</p>
                )}
              </div>

              <div className="card">
                <div className="row">
                  <h3 className="card-title" style={{ margin: 0 }}>AI Insight Panel</h3>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleCopyInsight}
                    disabled={!selected?.insight}
                  >
                    Copy Insight
                  </button>
                </div>
                <p className="muted-text">
                  {new Date(selected.timestamp).toLocaleString()}
                </p>
                {selected.insight ? (
                  <p className="bubble-text">{selected.insight}</p>
                ) : (
                  <p className="muted-text">Insight unavailable.</p>
                )}
              </div>

              <div className="card">
                <h3 className="card-title">Visualization Panel</h3>
                {visualizationRows.length === 0 ? (
                  <p className="muted-text">No chart data available.</p>
                ) : (
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      {chartType === 'bar' ? (
                        <BarChart data={visualizationRows}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#2563eb" />
                        </BarChart>
                      ) : (
                        <LineChart data={visualizationRows}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
    </section>
  )
}

export default AskAgentPage
