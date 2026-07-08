import { useEffect, useMemo, useRef, useState } from 'react'
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
import QueryHistorySidebar from '../components/QueryHistorySidebar'
import SuggestedQueries from '../components/SuggestedQueries'
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

function buildMetricsFromAnalytics(analyticsResults) {
  if (!analyticsResults) return []
  
  return Object.entries(analyticsResults).slice(0, 4).map(([key, value]) => ({
    label: key.replace(/_/g, ' '),
    value: formatValue(value),
  }))
}

function AskAgentPage() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading])
  const selected = useMemo(
    () => history.find((h) => h.id === selectedId) || history[0] || null,
    [history, selectedId],
  )

  const submitQuery = async (rawQuery) => {
    const query = rawQuery.trim()
    if (!query || isLoading) return

    setIsLoading(true)
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
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitQuery(input)
    }
  }

  const handleClearHistory = () => {
    if (confirm('Clear all conversation history?')) {
      setHistory([])
      setSelectedId(null)
      setError('')
    }
  }

  const visualizationRows = getChartRows(selected?.visualization_data)
  const chartType = selected?.visualization_data?.chart_type
  const analyticsResults = selected?.analytics_results
  const metrics = buildMetricsFromAnalytics(analyticsResults)

  const renderChart = () => {
    if (visualizationRows.length === 0) return null

    return (
      <div className="analysis-chart-container">
        <ResponsiveContainer>
          {chartType === 'bar' ? (
            <BarChart data={visualizationRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="url(#colorUv)" radius={[6, 6, 0, 0]} barSize={40} />
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={1}/>
                </linearGradient>
              </defs>
            </BarChart>
          ) : (
            <LineChart data={visualizationRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <section className={`agent-workspace ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="agent-container">
        {/* Left Sidebar */}
        <div className="agent-sidebar-wrapper">
          <QueryHistorySidebar
            history={history}
            selectedId={selectedId}
            onSelectQuery={setSelectedId}
            onClearHistory={handleClearHistory}
          />
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Main Area */}
        <div className="agent-main">
          {/* Header & Input Box */}
          <div className="workspace-header">
            <div className="workspace-title-row">
              <h1 className="agent-title">AI Business Analyst</h1>
              <div className="dataset-badge-agent">
                <span className="badge-dot"></span>
                <span className="badge-text">Dataset Active</span>
              </div>
            </div>
            
            <div className="workspace-input-area">
              <div className="workspace-input-wrapper">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about revenue, trends, comparisons, forecasts..."
                  rows={1}
                  disabled={isLoading}
                  className="workspace-input-field"
                />
                <button
                  className="workspace-send-btn"
                  onClick={() => submitQuery(input)}
                  disabled={!canSend}
                  title="Analyze"
                >
                  {isLoading ? <div className="spinner-small" /> : 'Analyze'}
                </button>
              </div>
              {error && <p className="workspace-error">{error}</p>}
            </div>
          </div>

          {/* Response Workspace */}
          <div className="workspace-content">
            {isLoading ? (
              <div className="workspace-loading">
                <div className="spinner-large" />
                <p>Analyzing your data...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="workspace-empty">
                <div className="empty-illustration">📊</div>
                <h2 className="welcome-title">Ready to Analyze</h2>
                <p className="welcome-text">Submit a query above to generate insights, metrics, and charts instantly.</p>
                <div className="suggested-queries-wrapper">
                  <SuggestedQueries
                    queries={SUGGESTIONS}
                    onSelect={submitQuery}
                    disabled={isLoading}
                  />
                </div>
              </div>
            ) : selected ? (
              <div className="analysis-response">
                {selected.error ? (
                  <div className="analysis-error-card">
                    <h3>Analysis Failed</h3>
                    <p>{selected.error}</p>
                  </div>
                ) : (
                  <>
                    {/* 1. Business Insight */}
                    <div className="analysis-section insight-card">
                      <div className="section-icon">✨</div>
                      <div className="insight-content">
                        <h3>Business Insight</h3>
                        <p>{selected.insight}</p>
                        <p className="query-reference">Query: "{selected.query}"</p>
                      </div>
                    </div>

                    {/* 2. Key Metrics */}
                    {metrics && metrics.length > 0 && (
                      <div className="analysis-section metrics-section">
                        {metrics.map((metric, idx) => (
                          <div key={idx} className="analysis-metric-card">
                            <p className="metric-label">{metric.label}</p>
                            <p className="metric-value">{metric.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. Visualization */}
                    {visualizationRows.length > 0 && (
                      <div className="analysis-section chart-card">
                        <h3>Visualization</h3>
                        {renderChart()}
                      </div>
                    )}

                    {/* 4. Supporting Analytics */}
                    {analyticsResults && (
                      <div className="analysis-section analytics-card">
                        <h3>Supporting Analytics</h3>
                        <div className="analytics-table-wrapper">
                          <table className="analytics-table">
                            <tbody>
                              {Object.entries(analyticsResults).map(([key, value]) => (
                                <tr key={key}>
                                  <td className="analytics-key">{key.replace(/_/g, ' ')}</td>
                                  <td className="analytics-value">{formatValue(value)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AskAgentPage

