function FileUpload({ selectedFile, onSelectFile, onUpload, isUploading, error }) {
  const handleChange = (event) => {
    const file = event.target.files?.[0] || null
    onSelectFile(file)
  }

  return (
    <div className="card">
      <h3 className="card-title">Upload CSV Dataset</h3>
      <p className="muted-text">Only .csv files are supported.</p>

      <input type="file" accept=".csv,text/csv" onChange={handleChange} />

      <div className="row">
        <div>
          <p className="label">Selected file</p>
          <p>{selectedFile ? selectedFile.name : 'None'}</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={onUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
    </div>
  )
}

export default FileUpload
