function DatasetInfo({ dataset }) {
  if (!dataset) return null

  return (
    <div className="card">
      <h3 className="card-title">Dataset Info</h3>
      <div className="grid-2">
        <div>
          <p className="label">File name</p>
          <p>{dataset.file_name}</p>
        </div>
        <div>
          <p className="label">Rows</p>
          <p>{dataset.row_count ?? dataset.rows}</p>
        </div>
        <div>
          <p className="label">Columns</p>
          <p>{dataset.column_count ?? dataset.columns}</p>
        </div>
        <div>
          <p className="label">Column names</p>
          <p className="wrap">{(dataset.column_names || []).join(', ')}</p>
        </div>
      </div>
    </div>
  )
}

export default DatasetInfo
