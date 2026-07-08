function QueryHistorySidebar({ history, selectedId, onSelectQuery, onClearHistory }) {
  return (
    <div className="agent-sidebar-left">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Conversation History</h3>
        {history.length > 0 && (
          <button
            className="sidebar-clear-btn"
            onClick={onClearHistory}
            title="Clear history"
          >
            ×
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="sidebar-empty">
          <p className="empty-text">No queries yet</p>
          <p className="empty-subtext">Start asking questions about your data</p>
        </div>
      ) : (
        <div className="history-scroll">
          {history.map((item) => (
            <button
              key={item.id}
              className={`history-item ${selectedId === item.id ? 'active' : ''}`}
              onClick={() => onSelectQuery(item.id)}
              title={item.query}
            >
              <span className="history-query">{item.query}</span>
              <span className="history-time">
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default QueryHistorySidebar
