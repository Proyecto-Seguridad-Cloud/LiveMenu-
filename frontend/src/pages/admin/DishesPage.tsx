import { Link } from 'react-router-dom'

export function DishesPage() {
  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">Gestión de Platos</h1>
        <p className="muted">Listado, filtros y cambios rápidos de disponibilidad.</p>
      </article>

      <article className="card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <input style={{ flex: 1, minWidth: 220 }} placeholder="Buscar plato..." />
          <select defaultValue="all">
            <option value="all">Todas categorías</option>
            <option>Entradas</option>
            <option>Platos fuertes</option>
          </select>
          <select defaultValue="available">
            <option value="available">Disponibles</option>
            <option value="all">Todos</option>
          </select>
          <Link to="/admin/dishes/new" className="btn btn-primary">Nuevo plato</Link>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {['Hamburguesa Especial', 'Ensalada Premium', 'Pizza Pepperoni'].map((dish) => (
            <div key={dish} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, border: '1px solid var(--lm-slate-200)', borderRadius: 10 }}>
              <div>
                <strong>{dish}</strong>
                <p className="muted">$25.00 · Entradas</p>
              </div>
              <Link className="btn btn-ghost" to="/admin/dishes/1/edit">Editar</Link>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
