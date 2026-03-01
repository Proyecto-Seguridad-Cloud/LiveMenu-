import { useParams } from 'react-router-dom'

export function PublicMenuPage() {
  const { slug } = useParams()

  return (
    <main className="menu-public">
      <header className="menu-header">
        <h1 className="title" style={{ marginBottom: 4 }}>Menú Público</h1>
        <p className="muted">/{slug}</p>

        <div className="category-tabs" style={{ marginTop: 12 }}>
          <button className="tab active" type="button">Entradas</button>
          <button className="tab" type="button">Fuertes</button>
          <button className="tab" type="button">Bebidas</button>
          <button className="tab" type="button">Postres</button>
        </div>
      </header>

      <section className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Carpaccio de Res</h2>
          <strong style={{ color: 'var(--lm-orange-600)' }}>$14.50</strong>
        </div>
        <p className="muted">Finas láminas de solomillo con aceite de trufa y parmesano.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <span className="status-chip">Sin gluten</span>
          <span className="status-chip">Popular</span>
        </div>
      </section>
    </main>
  )
}
