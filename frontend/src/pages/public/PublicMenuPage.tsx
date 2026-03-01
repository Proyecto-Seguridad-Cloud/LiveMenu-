import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { menuService } from '../../services/menu'
import type { PublicMenuCategory, PublicMenuResponse } from '../../types/menu'

function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return '$0.00'
  }

  return `$${parsed.toFixed(2)}`
}

export function PublicMenuPage() {
  const { slug } = useParams()

  const [menu, setMenu] = useState<PublicMenuResponse | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadMenu() {
      if (!slug) {
        setLoading(false)
        setErrorMessage('Slug de restaurante inválido')
        return
      }

      setLoading(true)
      setErrorMessage('')

      try {
        const response = await menuService.getBySlug(slug)
        setMenu(response)
        const firstCategoryId = response.categories[0]?.id || ''
        setActiveCategoryId(firstCategoryId)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No fue posible cargar el menú'
        setErrorMessage(message)
      } finally {
        setLoading(false)
      }
    }

    void loadMenu()
  }, [slug])

  const activeCategory: PublicMenuCategory | null = useMemo(() => {
    if (!menu || menu.categories.length === 0) {
      return null
    }

    return menu.categories.find((category) => category.id === activeCategoryId) || menu.categories[0]
  }, [activeCategoryId, menu])

  if (loading) {
    return (
      <main className="menu-public">
        <header className="menu-header">
          <h1 className="title" style={{ marginBottom: 4 }}>
            Menú Público
          </h1>
          <p className="muted">Cargando menú...</p>
        </header>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main className="menu-public">
        <header className="menu-header">
          <h1 className="title" style={{ marginBottom: 4 }}>
            Menú Público
          </h1>
          <p className="error-message">{errorMessage}</p>
        </header>
      </main>
    )
  }

  if (!menu) {
    return null
  }

  return (
    <main className="menu-public">
      <header className="menu-header">
        <h1 className="title" style={{ marginBottom: 4 }}>
          {menu.restaurant.name}
        </h1>
        <p className="muted">/{menu.restaurant.slug}</p>

        {menu.categories.length > 0 && (
          <div className="category-tabs" style={{ marginTop: 12 }}>
            {menu.categories.map((category) => (
              <button
                key={category.id}
                className={`tab ${activeCategory?.id === category.id ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {activeCategory ? (
        <>
          {activeCategory.dishes.map((dish) => (
            <section key={dish.id} className="card" style={{ marginTop: 12 }}>
              {dish.image_url && (
                <img
                  src={dish.image_url}
                  alt={dish.name}
                  style={{
                    width: '100%',
                    maxHeight: 220,
                    objectFit: 'cover',
                    borderRadius: 12,
                    marginBottom: 10,
                    border: '1px solid var(--lm-slate-200)',
                  }}
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6, gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{dish.name}</h2>
                <div style={{ textAlign: 'right' }}>
                  {dish.price_offer !== null ? (
                    <>
                      <strong style={{ color: 'var(--lm-orange-600)' }}>{formatMoney(dish.price_offer)}</strong>
                      <p className="muted" style={{ textDecoration: 'line-through' }}>
                        {formatMoney(dish.price)}
                      </p>
                    </>
                  ) : (
                    <strong style={{ color: 'var(--lm-orange-600)' }}>{formatMoney(dish.price)}</strong>
                  )}
                </div>
              </div>

              {dish.description && <p className="muted">{dish.description}</p>}

              {dish.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {dish.tags.map((tag) => (
                    <span key={`${dish.id}-${tag}`} className="status-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </section>
          ))}

          {activeCategory.dishes.length === 0 && (
            <section className="card" style={{ marginTop: 12 }}>
              <p className="muted">Esta categoría aún no tiene platos disponibles.</p>
            </section>
          )}
        </>
      ) : (
        <section className="card" style={{ marginTop: 12 }}>
          <p className="muted">Menú en actualización. Aún no hay categorías activas.</p>
        </section>
      )}
    </main>
  )
}
