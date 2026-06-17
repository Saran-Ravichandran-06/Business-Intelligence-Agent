import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/upload', label: 'Upload' },
  { to: '/ask-agent', label: 'Ask Agent' },
  { to: '/reports', label: 'Reports' },
]

function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>AI BI Analyst</h1>
        <p className="subtitle">Block 1 Foundation</p>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
