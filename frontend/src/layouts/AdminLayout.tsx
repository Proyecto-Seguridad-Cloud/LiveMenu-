import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Inicio' },
  { to: '/admin/restaurant', label: 'Mi Restaurante' },
  { to: '/admin/categories', label: 'Categorías' },
  { to: '/admin/dishes', label: 'Platos' },
  { to: '/admin/uploads', label: 'Imágenes' },
  { to: '/admin/qr', label: 'Mi Código QR' },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-badge">L</span>
          <span>LiveMenu Admin</span>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="topbar">
          <div>
            <p className="muted">Panel administrativo</p>
            <strong>Sesión activa</strong>
          </div>
          <div className="topbar-actions">
            <a className="btn btn-ghost" href="/m/demo" target="_blank" rel="noreferrer">
              Ver menú público
            </a>
            <button className="btn btn-primary" type="button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  )
}
