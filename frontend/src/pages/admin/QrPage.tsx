export function QrPage() {
  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">Mi Código QR</h1>
        <p className="muted">Descarga QR por formato y tamaño.</p>
      </article>

      <article className="card">
        <div style={{ display: 'grid', placeItems: 'center', padding: 24, border: '1px solid var(--lm-slate-200)', borderRadius: 12, marginBottom: 14 }}>
          <div style={{ width: 180, height: 180, background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }} />
          <p className="muted">Preview QR</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button className="btn btn-ghost" type="button">S</button>
          <button className="btn btn-primary" type="button">M</button>
          <button className="btn btn-ghost" type="button">L</button>
          <button className="btn btn-ghost" type="button">XL</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn btn-primary" type="button">PNG</button>
          <button className="btn btn-ghost" type="button">SVG</button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" type="button">Descargar</button>
          <button className="btn btn-ghost" type="button">Copiar enlace</button>
        </div>
      </article>
    </section>
  )
}
