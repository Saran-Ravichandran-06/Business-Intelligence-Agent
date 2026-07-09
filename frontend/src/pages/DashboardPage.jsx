import { useEffect, useState } from 'react'
import KPICard from '../components/KPICard'
import RegionPerformanceChart from '../components/RegionPerformanceChart'
import RevenueTrendChart from '../components/RevenueTrendChart'
import TopProductsChart from '../components/TopProductsChart'
import AIHighlights from '../components/AIHighlights'
import DashboardHeader from '../components/DashboardHeader'
import { useAppContext } from '../context/AppContext'
import {
  fetchDashboardKpis,
  fetchRegionPerformance,
  fetchRevenueTrend,
  fetchTopProducts,
  fetchLatestDatasetPreview,
} from '../services/api'

function DashboardPage() {
  const {
    dashboardLoaded, setDashboardLoaded,
    dashboardKpis: kpis, setDashboardKpis,
    dashboardTrend: trend, setDashboardTrend,
    dashboardTopProducts: topProducts, setDashboardTopProducts,
    dashboardRegions: regions, setDashboardRegions,
    datasetPreview: dataset, setDatasetPreview
  } = useAppContext()

  const [isLoading, setIsLoading] = useState(false)
  const [chartsLoading, setChartsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true)
      setChartsLoading(true)
      setError('')

      if (dashboardLoaded) {
        setIsLoading(false)
        setChartsLoading(false)
        return
      }

      try {
        const [kpiData, trendData, productsData, regionsData, datasetData] = await Promise.all([
          fetchDashboardKpis(),
          fetchRevenueTrend(),
          fetchTopProducts(),
          fetchRegionPerformance(),
          fetchLatestDatasetPreview(),
        ])

        setDashboardKpis(kpiData)
        setDashboardTrend(trendData.points || [])
        setDashboardTopProducts(productsData.items || [])
        setDashboardRegions(regionsData.regions || [])
        setDatasetPreview(datasetData)
        setDashboardLoaded(true)
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
    <section className="dashboard-section">
      <DashboardHeader dataset={dataset} isLoading={isLoading} />

      {error ? <p className="error-text">{error}</p> : null}

      {/* Row 1: Premium KPI Cards */}
      <div className="kpi-row">
        <KPICard
          label="Total Revenue"
          value={
            kpis ? '$' + kpis.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : isLoading ? '…' : '—'
          }
          trend={12.5}
          trendPositive={true}
        />
        <KPICard
          label="Total Profit"
          value={
            kpis && kpis.total_profit != null
              ? '$' + kpis.total_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })
              : isLoading
                ? '…'
                : 'N/A'
          }
          trend={8.2}
          trendPositive={true}
        />
        <KPICard
          label="Total Orders"
          value={kpis ? kpis.total_orders.toLocaleString() : isLoading ? '…' : '—'}
          trend={-2.1}
          trendPositive={false}
        />
        <KPICard
          label="Top Region"
          value={regions && regions.length > 0 ? regions[0].region : '—'}
          subtext={regions && regions.length > 0 ? '$' + regions[0].revenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : ''}
        />
      </div>

      {/* Row 2: Revenue Trend (70%) + AI Highlights (30%) */}
      <div className="dashboard-row-70-30">
        <div className="chart-container-main">
          <RevenueTrendChart points={trend} isLoading={chartsLoading} />
        </div>
        <div className="chart-container-side">
          <AIHighlights regions={regions} topProducts={topProducts} isLoading={chartsLoading} />
        </div>
      </div>

      {/* Row 3: Region Performance (50%) + Product Performance (50%) */}
      <div className="dashboard-row-50-50">
        <div className="chart-container">
          <RegionPerformanceChart regions={regions} isLoading={chartsLoading} />
        </div>
        <div className="chart-container">
          <TopProductsChart items={topProducts} isLoading={chartsLoading} />
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
