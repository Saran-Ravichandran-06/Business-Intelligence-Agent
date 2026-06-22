function ChatMessage({ role, content, metrics, chart, sources, timestamp }) {
  return (
    <div className={`chat-message ${role === 'user' ? 'user-message' : 'assistant-message'}`}>
      <div className="message-avatar">
        {role === 'user' ? '👤' : '🤖'}
      </div>

      <div className="message-content">
        {role === 'user' ? (
          <p className="message-text">{content}</p>
        ) : (
          <>
            {/* Business Insight */}
            <div className="insight-section">
              <p className="insight-text">{content}</p>
            </div>

            {/* Supporting Metrics */}
            {metrics && metrics.length > 0 && (
              <div className="metrics-section">
                <div className="metrics-grid">
                  {metrics.map((metric, idx) => (
                    <div key={idx} className="metric-card">
                      <p className="metric-label">{metric.label}</p>
                      <p className="metric-value">{metric.value}</p>
                      {metric.change && (
                        <p className={`metric-change ${metric.positive ? 'positive' : 'negative'}`}>
                          {metric.positive ? '↑' : '↓'} {metric.change}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supporting Chart */}
            {chart && (
              <div className="chart-section">
                {chart}
              </div>
            )}

            {/* Sources */}
            {sources && (
              <div className="sources-section">
                <p className="sources-title">📊 Analysis Sources</p>
                <div className="sources-list">
                  {Object.entries(sources).map(([key, value]) => (
                    <div key={key} className="source-item">
                      <span className="source-key">{key.replace(/_/g, ' ')}</span>
                      <span className="source-value">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            {timestamp && (
              <p className="message-timestamp">
                {new Date(timestamp).toLocaleTimeString()}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ChatMessage
