import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  // Shared
  const [datasetPreview, setDatasetPreview] = useState(null);

  // Dashboard State
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [dashboardKpis, setDashboardKpis] = useState(null);
  const [dashboardTrend, setDashboardTrend] = useState([]);
  const [dashboardTopProducts, setDashboardTopProducts] = useState([]);
  const [dashboardRegions, setDashboardRegions] = useState([]);

  // Ask Agent State
  const [agentInput, setAgentInput] = useState('');
  const [agentHistory, setAgentHistory] = useState([]);
  const [agentSelectedId, setAgentSelectedId] = useState(null);
  const [agentSidebarOpen, setAgentSidebarOpen] = useState(true);

  // Reports State
  const [reportType, setReportType] = useState('monthly');
  const [reportHistory, setReportHistory] = useState([]);
  const [reportSelectedId, setReportSelectedId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Reset Session
  const resetSession = () => {
    // Clear dashboards
    setDashboardLoaded(false);
    setDashboardKpis(null);
    setDashboardTrend([]);
    setDashboardTopProducts([]);
    setDashboardRegions([]);
    
    // Clear agent
    setAgentInput('');
    setAgentHistory([]);
    setAgentSelectedId(null);

    // Clear reports
    setReportHistory([]);
    setReportSelectedId(null);
    setReportType('monthly');
    setIsHistoryOpen(false);
  };

  const value = {
    datasetPreview, setDatasetPreview,
    dashboardLoaded, setDashboardLoaded,
    dashboardKpis, setDashboardKpis,
    dashboardTrend, setDashboardTrend,
    dashboardTopProducts, setDashboardTopProducts,
    dashboardRegions, setDashboardRegions,
    agentInput, setAgentInput,
    agentHistory, setAgentHistory,
    agentSelectedId, setAgentSelectedId,
    agentSidebarOpen, setAgentSidebarOpen,
    reportType, setReportType,
    reportHistory, setReportHistory,
    reportSelectedId, setReportSelectedId,
    isHistoryOpen, setIsHistoryOpen,
    resetSession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
