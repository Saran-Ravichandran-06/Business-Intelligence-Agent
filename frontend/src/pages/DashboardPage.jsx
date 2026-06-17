import { useEffect, useState } from 'react'
import KPICard from '../components/KPICard'
import RegionPerformanceChart from '../components/RegionPerformanceChart'
import RevenueTrendChart from '../components/RevenueTrendChart'
import TopProductsChart from '../components/TopProductsChart'
import {
  fetchDashboardKpis,
  fetchRegionPerformance,
  fetchRevenueTrend,
  fetchTopProducts,
} from '../services/api'

function DashboardPage() {
  const [kpis, setKpis] = useState(null)
  const [trend, setTrend] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [regions, setRegions] = useState([])

  const [isLoading, setIsLoading] = useState(false)
  const [chartsLoading, setChartsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true)
      setChartsLoading(true)
      setError('')

      try {
        const [kpiData, trendData, productsData, regionsData] = await Promise.all([
          fetchDashboardKpis(),
          fetchRevenueTrend(),
          fetchTopProducts(),
          fetchRegionPerformance(),
        ])

        setKpis(kpiData)
        setTrend(trendData.points || [])
        setTopProducts(productsData.items || [])
        setRegions(regionsData.regions || [])
      } catch (err) {
        setError(err?.message || 'Unable to load dashboard data.')
      } finally {
        setIsLoading(false)
        setChartsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  return (
    <section>
      <h2>Business Dashboard</h2>
      <p className="muted-text">
        KPIs and visualizations based directly on the latest uploaded dataset.
      </p>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="kpi-grid">
        <KPICard
          label="Total Revenue"
          value={
            kpis ? kpis.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : isLoading ? '…' : '—'
          }
        />
        <KPICard
          label="Total Orders"
          value={kpis ? kpis.total_orders.toLocaleString() : isLoading ? '…' : '—'}
        />
        <KPICard
          label="Total Profit"
          value={
            kpis && kpis.total_profit != null
              ? kpis.total_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })
              : isLoading
                ? '…'
                : 'N/A'
          }
        />
        <KPICard
          label="Unique Products"
          value={
            kpis && kpis.unique_products != null
              ? kpis.unique_products.toLocaleString()
              : isLoading
                ? '…'
                : 'N/A'
          }
        />
      </div>

      <div className="dashboard-grid">
        <RevenueTrendChart points={trend} isLoading={chartsLoading} />
        <TopProductsChart items={topProducts} isLoading={chartsLoading} />
        <RegionPerformanceChart regions={regions} isLoading={chartsLoading} />
      </div>
    </section>
  )
}

export default DashboardPage
