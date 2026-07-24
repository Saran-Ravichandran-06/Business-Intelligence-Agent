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

function formatNumberShort(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return num.toString()
}

function formatValue(value) {
  if (value === null || value === undefined) return 'N/A'
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).map(([k, v]) => {
      const valStr = typeof v === 'number' ? formatNumberShort(v) : v
      const keyStr = k.length > 3 && /^[A-Z][a-z]+$/.test(k) ? k.substring(0, 3) : k
      return `${keyStr}: ${valStr}`
    }).join('\n')
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.entries(parsed).map(([k, v]) => {
          const valStr = typeof v === 'number' ? formatNumberShort(v) : v
          const keyStr = k.length > 3 && /^[A-Z][a-z]+$/.test(k) ? k.substring(0, 3) : k
          return `${keyStr}: ${valStr}`
        }).join('\n')
      }
    } catch(e) {}
  }

  if (typeof value === 'number') {
    return formatNumberShort(value)
  }
  return String(value)
}

function getChartRows(visualizationData) {
  const labels = visualizationData?.labels || []
  const dataset = visualizationData?.datasets?.[0]
  const values = dataset?.values || []
  return labels.map((label, i) => ({ label, value: values[i] }))
}

function buildMetricsFromAnalytics(analyticsResults, analysisType) {
  if (!analyticsResults || !analyticsResults.summary) return []
  
  const summary = analyticsResults.summary || {}
  const dist = analyticsResults.distribution || []
  
  const formatMetric = (val, isPercentage = false, isCurrency = true) => {
    if (val === null || val === undefined) return 'N/A'
    if (isPercentage) return `${Number(val).toFixed(1)}%`
    if (typeof val === 'number') {
        const str = formatNumberShort(val)
        return isCurrency ? `₹${str}` : str
    }
    return String(val)
  }

  const capitalize = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const metrics = []
  
  switch(analysisType) {
    case 'group_by':
      metrics.push({ label: 'Top ' + capitalize(summary.dimension_label || 'Category'), value: summary.top_entity || 'N/A' })
      metrics.push({ label: capitalize(summary.metric_label || 'Revenue'), value: formatMetric(summary.top_value) })
      metrics.push({ label: 'Total', value: formatMetric(summary.total) })
      metrics.push({ label: 'Categories', value: formatMetric(summary.count, false, false) })
      break;
    case 'comparison':
      const diff = summary.difference
      const diffPct = summary.percent_difference
      const a = dist.length > 0 ? dist[0] : {}
      const b = dist.length > 1 ? dist[1] : {}
      if (a.label) metrics.push({ label: a.label, value: formatMetric(a.value) })
      if (b.label) metrics.push({ label: b.label, value: formatMetric(b.value) })
      metrics.push({ label: 'Difference', value: formatMetric(Math.abs(diff || 0)) })
      metrics.push({ label: 'Difference %', value: formatMetric(diffPct, true) })
      break;
    case 'lookup':
      metrics.push({ label: capitalize(summary.dimension_label || 'Entity'), value: summary.top_entity || 'N/A' })
      metrics.push({ label: capitalize(summary.metric_label || 'Revenue'), value: formatMetric(summary.top_value) })
      metrics.push({ label: 'Total Matches', value: formatMetric(summary.count, false, false) })
      break;
    case 'ranking':
      metrics.push({ label: 'Rank #1', value: summary.top_entity || 'N/A' })
      metrics.push({ label: capitalize(summary.metric_label || 'Revenue'), value: formatMetric(summary.top_value) })
      metrics.push({ label: 'Share %', value: formatMetric(summary.total ? (summary.top_value / summary.total) * 100 : 0, true) })
      metrics.push({ label: 'Total', value: formatMetric(summary.total) })
      break;
    case 'trend':
      const current = dist.length > 0 ? dist[dist.length - 1].value : 0
      const prev = dist.length > 1 ? dist[dist.length - 2].value : 0
      const growth = current - prev
      const changePct = prev ? (growth / prev) * 100 : 0
      metrics.push({ label: 'Current', value: formatMetric(current) })
      metrics.push({ label: 'Previous', value: formatMetric(prev) })
      metrics.push({ label: 'Growth', value: formatMetric(growth) })
      metrics.push({ label: 'Change %', value: formatMetric(changePct, true) })
      break;
    case 'forecast':
      metrics.push({ label: 'Forecast', value: summary.forecast_period || 'N/A' })
      metrics.push({ label: 'Expected', value: formatMetric(summary.predicted_value) })
      const lastHist = dist.length > 1 ? dist[dist.length - 2].value : 0
      const fGrowth = (summary.predicted_value || 0) - lastHist
      metrics.push({ label: 'Growth', value: formatMetric(fGrowth) })
      break;
    case 'diagnostic':
      metrics.push({ label: 'Root Cause', value: summary.top_contributor || 'N/A' })
      metrics.push({ label: 'Impact', value: formatMetric(summary.change_percent, true) })
      metrics.push({ label: 'Category', value: summary.most_affected_region ? 'Region' : (summary.most_affected_product ? 'Product' : 'Unknown') })
      break;
    default:
      if (summary.top_entity) metrics.push({ label: 'Top Entity', value: summary.top_entity })
      if (summary.total) metrics.push({ label: 'Total', value: formatMetric(summary.total) })
      break;
  }
  
  return metrics.slice(0, 4)
}

import { useAppContext } from '../context/AppContext'

function AskAgentPage() {
  const {
    agentInput: input, setAgentInput: setInput,
    agentHistory: history, setAgentHistory: setHistory,
    agentSelectedId: selectedId, setAgentSelectedId: setSelectedId,
    agentSidebarOpen: isSidebarOpen, setAgentSidebarOpen: setIsSidebarOpen,
  } = useAppContext()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading])
  const [selectedResponse, setSelectedResponse] = useState(null)

  useEffect(() => {
    const activeId = selectedId || (history.length > 0 ? history[0].id : null)
    if (!activeId) {
      setSelectedResponse(null)
      return
    }
    
    // Auto-select first item if selectedId is null
    if (!selectedId && history.length > 0) {
      setSelectedId(activeId)
    }
    
    try {
      const cached = localStorage.getItem(`agent_response_${activeId}`)
      if (cached) {
        setSelectedResponse(JSON.parse(cached))
      } else {
        setSelectedResponse({ error: "Response data not found." })
      }
    } catch (err) {
      console.error(err)
      localStorage.removeItem(`agent_response_${activeId}`)
      setSelectedResponse({ error: "Corrupted session data. Please submit a new query." })
    }
  }, [selectedId, history, setSelectedId])

  const submitQuery = async (rawQuery) => {
    const query = rawQuery.trim()
    if (!query || isLoading) return

    setIsLoading(true)
    setError('')
    setInput('')

    try {
      const response = await runAgentQuery(query)
      const id = crypto.randomUUID()
      const timestamp = new Date().toISOString()
      
      const responseToSave = {
        id,
        query,
        timestamp,
        ...response,
      }
      localStorage.setItem(`agent_response_${id}`, JSON.stringify(responseToSave))
      
      const historyItem = { id, query, timestamp }
      setHistory((prev) => [historyItem, ...prev])
      setSelectedId(id)
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
      history.forEach(h => localStorage.removeItem(`agent_response_${h.id}`))
      setHistory([])
      setSelectedId(null)
      setSelectedResponse(null)
      setError('')
    }
  }

  const handleDeleteQuery = (idToDelete) => {
    localStorage.removeItem(`agent_response_${idToDelete}`)
    setHistory(prev => {
      const newHistory = prev.filter(h => h.id !== idToDelete)
      if (selectedId === idToDelete) {
        setSelectedId(newHistory.length > 0 ? newHistory[0].id : null)
      }
      return newHistory
    })
  }

  const visualizationRows = getChartRows(selectedResponse?.visualization_data)
  const chartType = selectedResponse?.visualization_data?.chart_type
  const analyticsResults = selectedResponse?.analytics_results
  const analysisType = selectedResponse?.query_analysis?.analysis_type || 'unknown'
  const metrics = buildMetricsFromAnalytics(analyticsResults, analysisType)

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
            onDeleteQuery={handleDeleteQuery}
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
            <div className="dataset-badge-container">
              <div className="dataset-badge-agent">
                <span className="badge-dot"></span>
                <span className="badge-text">Dataset Active</span>
              </div>
            </div>
            <div className="workspace-input-area">
              <div className="workspace-input-flex">
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
            ) : selectedResponse ? (
              <div className="analysis-response">
                {selectedResponse.error ? (
                  <div className="analysis-error-card">
                    <h3>Analysis Failed</h3>
                    <p>{selectedResponse.error}</p>
                  </div>
                ) : (
                  <>
                    {/* 1. Business Insight */}
                    <div className="analysis-section insight-card">
                      <div className="insight-content">
                        <h3>Business Insight</h3>
                        <p>{selectedResponse.insight}</p>
                        <p className="query-reference">Query: "{selectedResponse.query}"</p>
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

