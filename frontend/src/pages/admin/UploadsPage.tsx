export function UploadsPage() {
  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">Gestión de Imágenes</h1>
        <p className="muted">Subida de JPG/PNG/WebP con máximo 5MB.</p>
      </article>

      <article className="card">
        <div style={{ border: '2px dashed var(--lm-orange-100)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <p style={{ marginTop: 0, fontWeight: 700 }}>Zona de carga</p>
          <p className="muted">Arrastra imágenes o selecciona archivos.</p>
          <button className="btn btn-primary" type="button">Seleccionar archivos</button>
        </div>
      </article>
    </section>
  )
}
