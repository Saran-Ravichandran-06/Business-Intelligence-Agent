import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function RevenueTrendChart({ points, isLoading }) {
  const [aggregation, setAggregation] = useState('monthly')
  const [timeRange, setTimeRange] = useState('all')

  const aggregatedData = useMemo(() => {
    if (!points || !points.length) return []

    // Parse dates and sort
    const sortedPoints = [...points].sort((a, b) => new Date(a.date) - new Date(b.date))

    // Apply time range filter
    let filtered = sortedPoints
    const now = new Date()

    if (timeRange === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filtered = sortedPoints.filter((p) => new Date(p.date) >= thirtyDaysAgo)
    } else if (timeRange === '90days') {
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      filtered = sortedPoints.filter((p) => new Date(p.date) >= ninetyDaysAgo)
    }

    // Aggregate based on selected interval
    if (aggregation === 'daily') {
      return filtered.map((p) => ({
        date: p.date,
        revenue: p.revenue || 0,
        displayDate: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
    }

    if (aggregation === 'weekly') {
      const weeks = {}
      filtered.forEach((point) => {
        const date = new Date(point.date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]

        if (!weeks[weekKey]) {
          weeks[weekKey] = { revenue: 0, count: 0 }
        }
        weeks[weekKey].revenue += point.revenue || 0
        weeks[weekKey].count += 1
      })

      return Object.entries(weeks).map(([weekKey, data]) => ({
        date: weekKey,
        revenue: Math.round(data.revenue / data.count),
        displayDate: new Date(weekKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
    }

    if (aggregation === 'monthly') {
      const months = {}
      filtered.forEach((point) => {
        const date = new Date(point.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`

        if (!months[monthKey]) {
          months[monthKey] = { revenue: 0, count: 0 }
        }
        months[monthKey].revenue += point.revenue || 0
        months[monthKey].count += 1
      })

      return Object.entries(months).map(([monthKey, data]) => ({
        date: monthKey,
        revenue: Math.round(data.revenue / data.count),
        displayDate: new Date(monthKey).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      }))
    }

    return filtered
  }, [points, aggregation, timeRange])

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="card-title">Revenue Trend</h3>
        <p className="muted-text">Loading trend...</p>
      </div>
    )
  }

  if (!points?.length) {
    return (
      <div className="card">
        <h3 className="card-title">Revenue Trend</h3>
        <p className="muted-text">No trend data available.</p>
      </div>
    )
  }

  return (
    <div className="card revenue-trend-card">
      <div className="trend-header">
        <div className="trend-title-section">
          <h3 className="card-title">Revenue Trend</h3>
          <p className="card-subtitle">Track revenue performance over time</p>
        </div>

        <div className="trend-controls">
          <div className="control-group">
            <label className="control-label">Aggregation</label>
            <div className="button-group">
              {['daily', 'weekly', 'monthly'].map((interval) => (
                <button
                  key={interval}
                  className={`btn-interval ${aggregation === interval ? 'active' : ''}`}
                  onClick={() => setAggregation(interval)}
                >
                  {interval.charAt(0).toUpperCase() + interval.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="trend-chart">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={aggregatedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              interval={Math.floor(aggregatedData.length / 6) || 0}
            />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => `$${value.toLocaleString()}`}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default RevenueTrendChart
