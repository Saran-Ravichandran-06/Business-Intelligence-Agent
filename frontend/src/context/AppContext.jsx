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
  
  const [agentHistory, setAgentHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('agent_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [agentSelectedId, setAgentSelectedId] = useState(() => {
    try {
      const stored = localStorage.getItem('agent_selected_id');
      if (stored) return stored;
      const history = localStorage.getItem('agent_history');
      const parsed = history ? JSON.parse(history) : [];
      return parsed.length > 0 ? parsed[0].id : null;
    } catch {
      return null;
    }
  });

  const [agentSidebarOpen, setAgentSidebarOpen] = useState(true);

  React.useEffect(() => {
    localStorage.setItem('agent_history', JSON.stringify(agentHistory));
  }, [agentHistory]);

  React.useEffect(() => {
    if (agentSelectedId) {
      localStorage.setItem('agent_selected_id', agentSelectedId);
    } else {
      localStorage.removeItem('agent_selected_id');
    }
  }, [agentSelectedId]);

  // Reports State
  const [reportType, setReportType] = useState('monthly');
  
  const [reportHistory, setReportHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('report_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [reportSelectedId, setReportSelectedId] = useState(() => {
    try {
      const stored = localStorage.getItem('report_selected_id');
      if (stored) return stored;
      const history = localStorage.getItem('report_history');
      const parsed = history ? JSON.parse(history) : [];
      return parsed.length > 0 ? parsed[0].id : null;
    } catch {
      return null;
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  React.useEffect(() => {
    localStorage.setItem('report_history', JSON.stringify(reportHistory));
  }, [reportHistory]);

  React.useEffect(() => {
    if (reportSelectedId) {
      localStorage.setItem('report_selected_id', reportSelectedId);
    } else {
      localStorage.removeItem('report_selected_id');
    }
  }, [reportSelectedId]);

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
