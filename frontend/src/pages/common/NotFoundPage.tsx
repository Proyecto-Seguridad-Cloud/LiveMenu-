import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page-wrap">
      <section className="card auth-card">
        <h1 className="auth-title">404</h1>
        <p className="auth-subtitle">La ruta solicitada no existe.</p>
        <Link className="btn btn-primary" to="/login">
          Volver al inicio
        </Link>
      </section>
    </div>
  )
}
