function AnalyticsResultTable({ results }) {
  if (!results) return null

  const entries = Object.entries(results)

  if (entries.length === 0) return null

  return (
    <div className="card">
      <h3 className="card-title">Analytics Results</h3>
      <div className="table-wrap">
        <table className="table">
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key}>
                <td>
                  <strong>{key}</strong>
                </td>
                <td>
                  {typeof value === 'object' && value !== null
                    ? JSON.stringify(value)
                    : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AnalyticsResultTable
