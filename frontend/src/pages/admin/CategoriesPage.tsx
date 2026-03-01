export function CategoriesPage() {
  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">Categorías</h1>
        <p className="muted">Reordenar, activar/desactivar y crear categorías.</p>
      </article>

      <article className="card">
        <div style={{ display: 'grid', gap: 10 }}>
          {['Entradas', 'Platos Fuertes', 'Postres', 'Bebidas'].map((name) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, border: '1px solid var(--lm-slate-200)', borderRadius: 10 }}>
              <strong>{name}</strong>
              <span className="status-chip">Activa</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" type="button">Nueva categoría</button>
          <button className="btn btn-primary" type="button">Guardar orden</button>
        </div>
      </article>
    </section>
  )
}
