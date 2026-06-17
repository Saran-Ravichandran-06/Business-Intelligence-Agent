function DiagnosticResultsCards({ results }) {
  if (!results) return null

  const changePct = results.change_percent
  const formattedChange =
    changePct == null
      ? 'N/A'
      : `${changePct.toFixed(1)}%`

  return (
    <div className="card">
      <h3 className="card-title">Diagnostic Results</h3>
      <div className="kpi-grid kpi-grid-2">
        <div className="kpi-card kpi-card-light">
          <p className="kpi-label">Revenue Change</p>
          <p className="kpi-value">{formattedChange}</p>
        </div>
        <div className="kpi-card kpi-card-light">
          <p className="kpi-label">Current Value</p>
          <p className="kpi-value">
            {results.current_value != null ? results.current_value.toLocaleString() : '—'}
          </p>
        </div>
        <div className="kpi-card kpi-card-light">
          <p className="kpi-label">Previous Value</p>
          <p className="kpi-value">
            {results.previous_value != null ? results.previous_value.toLocaleString() : '—'}
          </p>
        </div>
        <div className="kpi-card kpi-card-light">
          <p className="kpi-label">Most Affected</p>
          <p className="kpi-value">{results.top_contributor ?? 'N/A'}</p>
        </div>
      </div>

      {results.most_affected_region || results.most_affected_product ? (
        <div style={{ marginTop: 12 }}>
          {results.most_affected_region ? <p className="muted-text">Most Affected Region: {results.most_affected_region}</p> : null}
          {results.most_affected_product ? <p className="muted-text">Most Affected Product: {results.most_affected_product}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

export default DiagnosticResultsCards
