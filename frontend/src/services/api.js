const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
export { API_BASE_URL }

export async function pingBackend() {
  const response = await fetch(`${API_BASE_URL}/health`)

  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}`)
  }

  return response.json()
}

async function readErrorDetail(response) {
  try {
    const data = await response.json()
    if (data?.detail) return String(data.detail)
    if (data?.error) return String(data.error)
    if (data?.message) return String(data.message)
  } catch {
    // ignore
  }
  try {
    const text = await response.text()
    if (text) return text
  } catch {
    // ignore
  }
  return `Request failed with status ${response.status}`
}

export async function uploadDatasetCsv(file) {
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    throw new Error(await readErrorDetail(response))
  }

  return response.json()
}

export async function fetchLatestDatasetPreview() {
  const response = await fetch(`${API_BASE_URL}/dataset/preview`)

  if (!response.ok) {
    throw new Error(await readErrorDetail(response))
  }

  return response.json()
}

export async function fetchDashboardKpis() {
  const response = await fetch(`${API_BASE_URL}/dashboard/kpis`)

  if (!response.ok) {
    throw new Error(await readErrorDetail(response))
  }

  return response.json()
}

export async function fetchRevenueTrend() {
  const response = await fetch(`${API_BASE_URL}/dashboard/revenue-trend`)

  if (!response.ok) {
    throw new Error(await readErrorDetail(response))
  }

  return response.json()
}

export async function fetchTopProducts() {
  const response = await fetch(`${API_BASE_URL}/dashboard/top-products`)

  if (!response.ok) {
    throw new Error(await readErrorDetail(response))
  }

  return response.json()
}

export async function fetchRegionPerformance() {
  const response = await fetch(`${API_BASE_URL}/dashboard/regions`)

  if (!response.ok) {
    throw new Error(await readErrorDetail(response))
  }

  return response.json()
}

export async function runAgentQuery(query) {
  const response = await fetch(`${API_BASE_URL}/agent/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    throw new Error(await readErrorDetail(response))
  }

  return response.json()
}

export async function generateReport(reportType, options = {}) {
  const payload = { 
    report_type: reportType,
    include_charts: options.charts ?? true,
    include_ai_insights: options.insights ?? true,
    include_forecast: options.forecast ?? true,
  }

  const response = await fetch(`${API_BASE_URL}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorDetail(response))
  }

  return response.json()
}

export function getReportDownloadPdfUrl() {
  return `${API_BASE_URL}/reports/download/pdf`
}

export function getReportDownloadCsvUrl() {
  return `${API_BASE_URL}/reports/download/csv`
}
