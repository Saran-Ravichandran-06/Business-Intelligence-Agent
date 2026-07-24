function QueryHistorySidebar({ history, selectedId, onSelectQuery, onClearHistory, onDeleteQuery }) {
  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (confirm('Delete this conversation?')) {
      onDeleteQuery(id)
    }
  }

  return (
    <div className="agent-sidebar-left">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Conversation History</h3>
        {history.length > 0 && (
          <button
            className="sidebar-clear-btn"
            onClick={onClearHistory}
            title="Clear all history"
          >
            Clear All
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
              style={{ position: 'relative', display: 'block', width: '100%' }}
            >
              <div style={{ paddingRight: '20px' }}>
                <span className="history-query">{item.query}</span>
                <span className="history-time">
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <span
                className="history-item-delete"
                onClick={(e) => handleDelete(e, item.id)}
                title="Delete this conversation"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  fontSize: '16px',
                  lineHeight: '1',
                  color: '#94a3b8',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default QueryHistorySidebar
