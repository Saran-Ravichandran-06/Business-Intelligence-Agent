import { useState } from 'react'
import DatasetInfo from '../components/DatasetInfo'
import DatasetPreviewTable from '../components/DatasetPreviewTable'
import FileUpload from '../components/FileUpload'
import { fetchLatestDatasetPreview, uploadDatasetCsv } from '../services/api'

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(null)

  const handleSelectFile = (file) => {
    setMessage('')
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
    setMessage('')
    setPreview(null)

    try {
      await uploadDatasetCsv(selectedFile)
      setMessage('Upload successful. Loading preview...')
      const previewData = await fetchLatestDatasetPreview()
      setPreview(previewData)
      setMessage('Upload successful.')
    } catch (err) {
      setError(err?.message || 'Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section>
      <h2>Upload</h2>
      <p className="muted-text">
        Upload a CSV dataset and preview the first 10 rows.
      </p>

      <div className="stack">
        <FileUpload
          selectedFile={selectedFile}
          onSelectFile={handleSelectFile}
          onUpload={handleUpload}
          isUploading={isUploading}
          error={error}
        />

        {message ? <p className="success-text">{message}</p> : null}

        <DatasetInfo dataset={preview} />
        <DatasetPreviewTable
          columnNames={preview?.column_names}
          rows={preview?.first_10_rows}
        />
      </div>
    </section>
  )
}

export default UploadPage
