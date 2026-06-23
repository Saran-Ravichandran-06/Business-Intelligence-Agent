import { useMemo, useState } from 'react'
import ReportBuilder from '../components/ReportBuilder'
import ReportPreview from '../components/ReportPreview'
import ReportHistoryCard from '../components/ReportHistoryCard'
import { generateReport, getReportDownloadPdfUrl, getReportDownloadCsvUrl } from '../services/api'

function ReportsPage() {
  const [reportType, setReportType] = useState('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const selected = useMemo(
    () => history.find((r) => r.id === selectedId) || history[0] || null,
    [history, selectedId],
  )

  const onGenerate = async () => {
    setIsLoading(true)
    setError('')
    try {
      const report = await generateReport(reportType)
      const item = { id: crypto.randomUUID(), ...report }
      setHistory((prev) => [item, ...prev])
      setSelectedId(item.id)
    } catch (err) {
      setError(err?.message || 'Failed to generate report.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPdf = () => {
    const url = getReportDownloadPdfUrl()
    window.open(url, '_blank')
  }

  const handleDownloadCsv = () => {
    const url = getReportDownloadCsvUrl()
    window.open(url, '_blank')
  }

  return (
    <section className="reports-center">
      <div className="reports-header">
        <div>
          <h1 className="reports-title">Reports Center</h1>
          <p className="reports-subtitle">Generate and export executive business reports</p>
        </div>
      </div>

      {error && <div className="reports-error">{error}</div>}

      <div className="reports-main">
        {/* Left Panel - Report Builder */}
        <div className="reports-left">
          <ReportBuilder
            onGenerate={onGenerate}
            isLoading={isLoading}
            reportType={reportType}
            onTypeChange={setReportType}
          />
        </div>

        {/* Right Panel - Live Preview */}
        <div className="reports-right">
          <ReportPreview report={selected} isLoading={isLoading} />
        </div>
      </div>

      {/* Bottom Section - Report History */}
      {history.length > 0 && (
        <div className="reports-history-section">
          <div className="history-header">
            <h2 className="history-title">Report History</h2>
            <p className="history-subtitle">{history.length} report{history.length !== 1 ? 's' : ''} generated</p>
          </div>

          <div className="history-grid">
            {history.map((item) => (
              <ReportHistoryCard
                key={item.id}
                report={item}
                isSelected={selectedId === item.id}
                onClick={() => setSelectedId(item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default ReportsPage
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
    </section>
  )
}

export default ReportsPage
