function SuggestedQueries({ queries, onSelect, disabled }) {
  return (
    <div className="suggested-queries">
      <p className="suggestions-title">💡 Try asking:</p>
      <div className="suggestions-grid">
        {queries.map((query) => (
          <button
            key={query}
            className="suggestion-card"
            onClick={() => onSelect(query)}
            disabled={disabled}
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SuggestedQueries
