import { useMemo, useState, useEffect } from 'react'
import ReportBuilder from '../components/ReportBuilder'
import ReportPreview from '../components/ReportPreview'
import { generateReport } from '../services/api'

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

  const [selectedResponse, setSelectedResponse] = useState(null)

  useEffect(() => {
    const activeId = selectedId || (history.length > 0 ? history[0].id : null)
    if (!activeId) {
      setSelectedResponse(null)
      return
    }

    if (!selectedId && history.length > 0) {
      setSelectedId(activeId)
    }

    try {
      const cached = localStorage.getItem(`report_response_${activeId}`)
      if (cached) {
        setSelectedResponse(JSON.parse(cached))
      } else {
        setSelectedResponse(null)
      }
    } catch (err) {
      console.error(err)
      localStorage.removeItem(`report_response_${activeId}`)
      setSelectedResponse(null)
    }
  }, [selectedId, history, setSelectedId])

  const handleDeleteReport = (e, idToDelete) => {
    e.stopPropagation()
    if (confirm('Delete this report?')) {
      localStorage.removeItem(`report_response_${idToDelete}`)
      setHistory(prev => {
        const newHistory = prev.filter(h => h.id !== idToDelete)
        if (selectedId === idToDelete) {
          setSelectedId(newHistory.length > 0 ? newHistory[0].id : null)
        }
        return newHistory
      })
    }
  }


  const onGenerate = async (options) => {
    setIsLoading(true)
    setError('')
    try {
      const report = await generateReport(reportType, options)
      const id = crypto.randomUUID()
      const generatedAt = Date.now()
      
      const responseToSave = { id, type: reportType, generatedAt, ...report }
      localStorage.setItem(`report_response_${id}`, JSON.stringify(responseToSave))

      const historyItem = { id, type: reportType, generatedAt }
      setHistory((prev) => [historyItem, ...prev])
      setSelectedId(id)
      setIsHistoryOpen(false)
    } catch (err) {
      setError(err?.message || 'Failed to generate report.')
    } finally {
      setIsLoading(false)
    }
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
                          style={{ position: 'relative', paddingRight: '40px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h4 className="item-title" style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{typeLabel}</h4>
                            <span style={{ fontSize: '0.85rem', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '12px', fontWeight: 500, border: '1px solid #bfdbfe' }}>
                              {datasetPreview?.file_name || datasetPreview?.filename || 'Current Dataset'}
                            </span>
                          </div>
                          <p className="item-date" style={{ margin: 0 }}>Generated: {dateStr} • {timeStr}</p>
                          
                          <span
                            className="history-item-delete"
                            onClick={(e) => handleDeleteReport(e, item.id)}
                            title="Delete this report"
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              fontSize: '18px',
                              lineHeight: '1',
                              color: '#94a3b8',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                          >
                            ×
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <ReportPreview report={selectedResponse} isLoading={isLoading} />
          )}
        </div>
      </div>
    </section>
  )
}

export default ReportsPage
