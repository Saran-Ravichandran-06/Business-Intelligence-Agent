function DatasetPreviewTable({ columnNames, rows }) {
  if (!columnNames?.length) return null
  if (!rows?.length) {
    return (
      <div className="card">
        <h3 className="card-title">Preview (first 10 rows)</h3>
        <p className="muted-text">No preview rows available.</p>
      </div>
    )
  }

  return (
    <>
      <div className="table-wrap" style={{ flex: 1, overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              {columnNames.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {columnNames.map((col) => (
                  <td key={col}>{String(row?.[col] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default DatasetPreviewTable
