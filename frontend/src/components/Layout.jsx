import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import GlobalHeader from './GlobalHeader'

function Layout() {
  return (
    <div className="modern-app-layout">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main content area with fixed header + scrollable content */}
      <div className="layout-main">
        {/* Fixed Header */}
        <GlobalHeader />

        {/* Scrollable Content */}
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
