import { Link } from 'react-router-dom'

export function AdminDashboardPage() {
  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">Dashboard</h1>
        <p className="muted">Estado rápido de configuración del restaurante.</p>

        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span className="status-chip">Restaurante listo</span>
          <span className="status-chip">Categorías listas</span>
          <span className="status-chip">Platos en progreso</span>
        </div>
      </article>

      <article className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link to="/admin/restaurant" className="btn btn-ghost">Configurar restaurante</Link>
        <Link to="/admin/categories" className="btn btn-ghost">Crear categorías</Link>
        <Link to="/admin/dishes/new" className="btn btn-primary">Agregar plato</Link>
        <Link to="/admin/qr" className="btn btn-ghost">Generar QR</Link>
      </article>
    </section>
  )
}
