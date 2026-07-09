import { useMemo, useState } from 'react'
import ReportBuilder from '../components/ReportBuilder'
import ReportPreview from '../components/ReportPreview'
import { generateReport, getReportDownloadPdfUrl, getReportDownloadCsvUrl } from '../services/api'

import { useAppContext } from '../context/AppContext'

function ReportsPage() {
  const {
    reportType, setReportType,
    reportHistory: history, setReportHistory: setHistory,
    reportSelectedId: selectedId, setReportSelectedId: setSelectedId,
    isHistoryOpen, setIsHistoryOpen,
  } = useAppContext()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const selected = useMemo(
    () => history.find((r) => r.id === selectedId) || history[0] || null,
    [history, selectedId],
  )

  const onGenerate = async () => {
    setIsLoading(true)
    setError('')
    try {
      const report = await generateReport(reportType)
      const item = { 
        id: crypto.randomUUID(), 
        type: reportType,
        generatedAt: Date.now(),
        ...report 
      }
      setHistory((prev) => [item, ...prev])
      setSelectedId(item.id)
      setIsHistoryOpen(false)
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
      {/* Left Panel - Report Builder Sidebar */}
      <div className="reports-sidebar">
        <ReportBuilder
          onGenerate={onGenerate}
          isLoading={isLoading}
          reportType={reportType}
          onTypeChange={setReportType}
          isHistoryOpen={isHistoryOpen}
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        />
      </div>

      {/* Right Panel - Scrollable Content */}
      <div className="reports-content-area">
        <div className="reports-header">
          <div>
            <h1 className="reports-title">Reports Center</h1>
            <p className="reports-subtitle">Generate and export executive business reports</p>
          </div>
        </div>

        {error && <div className="reports-error">{error}</div>}

        <div className="reports-main-content">
          {isHistoryOpen ? (
            <div className="report-history-view">
              <h2 className="history-view-title">Report History</h2>
              {history.length === 0 ? (
                <div className="empty-history-state">
                  <p>No reports generated yet.</p>
                  <p>Generate your first report to see it here.</p>
                </div>
              ) : (
                <div className="history-view-list">
                  {history.map((item) => {
                    const dateObj = new Date(item.generatedAt || Date.now())
                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    const typeLabel = item.type === 'monthly' ? 'Monthly Report' : item.type === 'quarterly' ? 'Quarterly Report' : 'Full Business Review'
                    
                    return (
                      <div
                        key={item.id}
                        className={`history-list-item ${selectedId === item.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedId(item.id)
                          setIsHistoryOpen(false)
                        }}
                      >
                        <h4 className="item-title">{typeLabel}</h4>
                        <p className="item-date">Generated: {dateStr} • {timeStr}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <ReportPreview report={selected} isLoading={isLoading} />
          )}
        </div>
      </div>
    </section>
  )
}

export default ReportsPage
