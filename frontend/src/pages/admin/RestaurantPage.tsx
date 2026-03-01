export function RestaurantPage() {
  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">Mi Restaurante</h1>
        <p className="muted">Datos principales, logo y slug público.</p>
      </article>

      <article className="card">
        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input id="name" placeholder="La Parrilla del Chef" />
        </div>
        <div className="field">
          <label htmlFor="description">Descripción</label>
          <textarea id="description" rows={4} placeholder="Especialistas en cortes y brasas." />
        </div>
        <div className="field">
          <label htmlFor="phone">Teléfono</label>
          <input id="phone" placeholder="+57 300 000 0000" />
        </div>
        <div className="field">
          <label htmlFor="slug">Slug (solo lectura)</label>
          <input id="slug" readOnly value="la-parrilla-del-chef" />
        </div>
        <button className="btn btn-primary" type="button">Guardar cambios</button>
      </article>
    </section>
  )
}
