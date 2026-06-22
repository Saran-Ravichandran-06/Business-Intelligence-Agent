import { useState } from 'react'
import DatasetSummary from '../components/DatasetSummary'
import DatasetPreviewTable from '../components/DatasetPreviewTable'
import FileUpload from '../components/FileUpload'
import DatasetStatus from '../components/DatasetStatus'
import { fetchLatestDatasetPreview, uploadDatasetCsv } from '../services/api'

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  const handleSelectFile = (file) => {
    setError('')
    setPreview(null)

    if (!file) {
      setSelectedFile(null)
      return
    }

    const isCsv = file.name.toLowerCase().endsWith('.csv')
    if (!isCsv) {
      setSelectedFile(null)
      setError('Only .csv files are supported.')
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError('')
    setPreview(null)

    try {
      await uploadDatasetCsv(selectedFile)
      const previewData = await fetchLatestDatasetPreview()
      setPreview(previewData)
    } catch (err) {
      setError(err?.message || 'Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="upload-section">
      <div className="upload-header">
        <div className="upload-title-section">
          <h1 className="upload-title">Upload Dataset</h1>
          <p className="upload-subtitle">Add a CSV file to get started with your analysis</p>
        </div>
      </div>

      {!preview ? (
        <div className="upload-main">
          <div className="upload-content">
            <FileUpload
              selectedFile={selectedFile}
              onSelectFile={handleSelectFile}
              onUpload={handleUpload}
              isUploading={isUploading}
              error={error}
            />
          </div>
          
          <div className="upload-sidebar">
            <DatasetStatus dataset={null} isLoading={isUploading} />
          </div>
        </div>
      ) : (
        <div className="upload-success">
          <div className="success-content">
            <div className="success-header">
              <div className="success-icon">✓</div>
              <h2 className="success-title">Dataset Uploaded Successfully</h2>
              <p className="success-subtitle">{selectedFile?.name}</p>
            </div>

            <DatasetSummary dataset={preview} />

            <div className="preview-section">
              <h3 className="preview-title">Data Preview</h3>
              <DatasetPreviewTable
                columnNames={preview?.column_names}
                rows={preview?.first_10_rows}
              />
            </div>
          </div>

          <div className="success-sidebar">
            <DatasetStatus dataset={preview} isLoading={false} />
          </div>
        </div>
      )}
    </section>
  )
}

export default UploadPage
