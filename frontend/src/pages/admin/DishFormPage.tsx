type DishFormPageProps = {
  mode: 'new' | 'edit'
}

export function DishFormPage({ mode }: DishFormPageProps) {
  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">{mode === 'new' ? 'Nuevo Plato' : 'Editar Plato'}</h1>
        <p className="muted">Formulario base para nombre, precios, etiquetas e imagen.</p>
      </article>

      <article className="card">
        <div className="field">
          <label htmlFor="category">Categoría</label>
          <select id="category" defaultValue="">
            <option value="" disabled>Selecciona una categoría</option>
            <option>Entradas</option>
            <option>Platos fuertes</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input id="name" placeholder="Pizza Margherita" />
        </div>

        <div className="field">
          <label htmlFor="price">Precio base</label>
          <input id="price" type="number" placeholder="12.50" />
        </div>

        <div className="field">
          <label htmlFor="offer">Precio oferta</label>
          <input id="offer" type="number" placeholder="Opcional" />
        </div>

        <div className="field">
          <label htmlFor="description">Descripción</label>
          <textarea id="description" rows={4} placeholder="Descripción corta del plato" />
        </div>

        <button className="btn btn-primary" type="button">Guardar</button>
      </article>
    </section>
  )
}
