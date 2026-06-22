import { useRef, useState } from 'react'

function FileUpload({ selectedFile, onSelectFile, onUpload, isUploading, error }) {
  const fileInputRef = useRef(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleChange = (event) => {
    const file = event.target.files?.[0] || null
    onSelectFile(file)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const file = e.dataTransfer.files?.[0] || null
    onSelectFile(file)
  }

  const handleClickUpload = async () => {
    if (!selectedFile || isUploading) return
    
    // Simulate progress
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + Math.random() * 30
      })
    }, 300)

    await onUpload()
    
    clearInterval(interval)
    setUploadProgress(100)
    setTimeout(() => setUploadProgress(0), 1000)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="upload-container">
      <div
        className={`drag-drop-zone ${isDragActive ? 'active' : ''} ${selectedFile ? 'selected' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {!selectedFile ? (
          <div className="drag-drop-empty">
            <div className="upload-icon">📁</div>
            <h3 className="drag-drop-title">Upload your dataset</h3>
            <p className="drag-drop-text">
              Drag and drop your CSV file here or click to browse
            </p>
            <div className="supported-formats">
              <span className="format-badge">CSV</span>
              <span className="format-size">Max 100MB</span>
            </div>
          </div>
        ) : (
          <div className="drag-drop-selected">
            <div className="file-icon">✓</div>
            <p className="selected-file-name">{selectedFile.name}</p>
            <p className="selected-file-size">{formatFileSize(selectedFile.size)}</p>
            {!isUploading && !error && (
              <p className="selected-file-ready">Ready to upload</p>
            )}
          </div>
        )}

        {isUploading && (
          <div className="upload-progress-wrapper">
            <div className="upload-progress">
              <div
                className="upload-progress-bar"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="upload-status">Uploading {Math.min(100, Math.round(uploadProgress))}%</p>
          </div>
        )}
      </div>

      {selectedFile && !isUploading && (
        <button
          type="button"
          className="upload-button"
          onClick={handleClickUpload}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Dataset'}
        </button>
      )}

      {error && <p className="upload-error">{error}</p>}
    </div>
  )
}

export default FileUpload
