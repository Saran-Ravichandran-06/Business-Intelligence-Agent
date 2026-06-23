import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/upload', label: 'Upload', icon: '📁' },
  { to: '/ask-agent', label: 'Ask Agent', icon: '💬' },
  { to: '/reports', label: 'Reports', icon: '📈' },
]

function Sidebar() {
  return (
    <aside className="modern-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🔍</span>
          <div className="logo-text">
            <h1 className="logo-title">BI Agent</h1>
            <p className="logo-subtitle">Analytics</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.to === '/' && <div className="nav-accent-bar"></div>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-info">
          <p className="info-label">Version</p>
          <p className="info-value">1.0.0</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
