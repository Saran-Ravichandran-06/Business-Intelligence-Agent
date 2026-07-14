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
    datasetPreview
  } = useAppContext()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const selected = useMemo(
    () => history.find((r) => r.id === selectedId) || history[0] || null,
    [history, selectedId],
  )

  const onGenerate = async (options) => {
    setIsLoading(true)
    setError('')
    try {
      const report = await generateReport(reportType, options)
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
              {history.length === 0 ? (
                <div className="empty-report-card">
                  <div className="empty-state-content">
                    <h2 className="empty-title">Report History</h2>
                    <p className="empty-text">No reports generated yet.</p>
                    <p className="empty-subtext">Generate your first report to see it here.</p>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="history-view-title">Report History</h2>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h4 className="item-title" style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{typeLabel}</h4>
                            <span style={{ fontSize: '0.85rem', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '12px', fontWeight: 500, border: '1px solid #bfdbfe' }}>
                              {datasetPreview?.file_name || datasetPreview?.filename || 'Current Dataset'}
                            </span>
                          </div>
                          <p className="item-date" style={{ margin: 0 }}>Generated: {dateStr} • {timeStr}</p>
                        </div>
                      )
                    })}
                  </div>
                </>
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
