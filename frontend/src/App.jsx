import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AskAgentPage from './pages/AskAgentPage'
import DashboardPage from './pages/DashboardPage'
import ReportsPage from './pages/ReportsPage'
import UploadPage from './pages/UploadPage'
import { AppProvider } from './context/AppContext'

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/ask-agent" element={<AskAgentPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  )
}

export default App
