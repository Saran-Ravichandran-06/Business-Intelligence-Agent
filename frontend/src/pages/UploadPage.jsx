import { useState } from 'react'
import DatasetSummary from '../components/DatasetSummary'
import DatasetPreviewTable from '../components/DatasetPreviewTable'
import FileUpload from '../components/FileUpload'
import DatasetStatus from '../components/DatasetStatus'
import { fetchLatestDatasetPreview, uploadDatasetCsv } from '../services/api'
import { useAppContext } from '../context/AppContext'

function UploadPage() {
  const { datasetPreview: preview, setDatasetPreview: setPreview, resetSession } = useAppContext()
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

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
      resetSession()
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
        <div className="upload-success-layout">
          <div className="upload-success-left">
            <div className="success-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 className="success-title" style={{ fontSize: '1rem', margin: 0 }}>Dataset Uploaded Successfully</h2>
                <div className="success-icon" style={{ margin: 0 }}>✓</div>
              </div>
              <p className="success-subtitle" style={{ margin: 0 }}>{preview?.file_name || preview?.filename || selectedFile?.name || 'Current Dataset'}</p>
            </div>
            <DatasetSummary dataset={preview} />
          </div>

          <div className="upload-success-right">
            <div className="preview-section scrollable-preview-container">
              <h3 className="preview-title">Data Preview</h3>
              <div className="scrollable-table-wrapper">
                <DatasetPreviewTable
                  columnNames={preview?.column_names}
                  rows={preview?.first_10_rows}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default UploadPage
