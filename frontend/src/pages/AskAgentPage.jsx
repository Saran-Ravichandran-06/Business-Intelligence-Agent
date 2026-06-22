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
import AnalysisDetailsSidebar from '../components/AnalysisDetailsSidebar'
import ChatMessage from '../components/ChatMessage'
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
  
  return Object.entries(analyticsResults).slice(0, 3).map(([key, value]) => ({
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
  const messagesEndRef = useRef(null)

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading])
  const selected = useMemo(
    () => history.find((h) => h.id === selectedId) || history[0] || null,
    [history, selectedId],
  )

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

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

  const handleSelectQuery = (id) => {
    setSelectedId(id)
  }

  const visualizationRows = getChartRows(selected?.visualization_data)
  const chartType = selected?.visualization_data?.chart_type
  const queryAnalysis = selected?.query_analysis
  const analyticsResults = selected?.analytics_results
  const metrics = buildMetricsFromAnalytics(analyticsResults)

  const renderChart = () => {
    if (visualizationRows.length === 0) return null

    return (
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          {chartType === 'bar' ? (
            <BarChart data={visualizationRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={visualizationRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <section className="agent-workspace">
      <div className="agent-container">
        {/* Left Sidebar */}
        <QueryHistorySidebar
          history={history}
          selectedId={selectedId}
          onSelectQuery={handleSelectQuery}
          onClearHistory={handleClearHistory}
        />

        {/* Center Chat Area */}
        <div className="agent-main">
          <div className="agent-header">
            <h1 className="agent-title">AI Business Analyst</h1>
            <p className="agent-subtitle">Analyze your data with natural language queries</p>
            <div className="dataset-badge-agent">
              <span className="badge-dot"></span>
              <span className="badge-text">Dataset Active</span>
            </div>
          </div>

          <div className="chat-container">
            {history.length === 0 ? (
              <div className="chat-welcome">
                <h2 className="welcome-title">Welcome to AI Business Analyst</h2>
                <p className="welcome-text">Ask questions about your data and get instant insights</p>
                <SuggestedQueries
                  queries={SUGGESTIONS}
                  onSelect={submitQuery}
                  disabled={isLoading}
                />
              </div>
            ) : (
              <div className="messages-list">
                {history
                  .slice()
                  .reverse()
                  .map((item) => (
                    <div key={item.id}>
                      <ChatMessage role="user" content={item.query} />
                      {item.error ? (
                        <ChatMessage
                          role="assistant"
                          content={`Unable to analyze: ${item.error}`}
                        />
                      ) : (
                        <ChatMessage
                          role="assistant"
                          content={item.insight || 'Analysis complete'}
                          metrics={metrics}
                          chart={renderChart()}
                          sources={item.analytics_results}
                          timestamp={item.timestamp}
                        />
                      )}
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="chat-input-area">
            {error && <p className="chat-error">{error}</p>}
            
            <div className="chat-input-wrapper">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about revenue, trends, comparisons, forecasts..."
                rows={1}
                disabled={isLoading}
                className="chat-input-field"
              />
              <button
                className="chat-send-btn"
                onClick={() => submitQuery(input)}
                disabled={!canSend}
                title="Send (Shift+Enter for new line)"
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
            
            <p className="input-hint">
              {isLoading ? 'Processing your query...' : 'Tip: Use Shift+Enter for a new line'}
            </p>
          </div>
        </div>

        {/* Right Sidebar */}
        <AnalysisDetailsSidebar analysis={queryAnalysis} confidence={75} />
      </div>
    </section>
  )
}

export default AskAgentPage

