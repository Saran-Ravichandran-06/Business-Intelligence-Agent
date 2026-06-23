function ReportHistoryCard({ report, isSelected, onClick }) {
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getReportIcon = (type) => {
    switch (type) {
      case 'monthly':
        return '📅'
      case 'quarterly':
        return '📊'
      case 'full_dataset':
        return '📈'
      default:
        return '📄'
    }
  }

  const getReportLabel = (type) => {
    switch (type) {
      case 'monthly':
        return 'Monthly Report'
      case 'quarterly':
        return 'Quarterly Report'
      case 'full_dataset':
        return 'Full Business Review'
      default:
        return 'Report'
    }
  }

  return (
    <div
      className={`report-history-card ${isSelected ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="card-header">
        <span className="card-icon">{getReportIcon(report.report_type)}</span>
        <div className="card-title-section">
          <h4 className="card-title">{getReportLabel(report.report_type)}</h4>
          <p className="card-date">{formatDate(report.generated_at)}</p>
        </div>
      </div>

      <div className="card-actions">
        <button className="action-btn download-pdf" title="Download PDF">
          📥 PDF
        </button>
        <button className="action-btn download-csv" title="Download CSV">
          📊 CSV
        </button>
      </div>
    </div>
  )
}

export default ReportHistoryCard
