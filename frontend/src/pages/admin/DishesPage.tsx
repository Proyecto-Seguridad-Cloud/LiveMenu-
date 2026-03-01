import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { categoriesService } from '../../services/categories'
import { dishesService } from '../../services/dishes'
import { ApiError } from '../../services/http'
import type { Category } from '../../types/category'
import type { Dish } from '../../types/dish'

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

export function DishesPage() {
  const { token } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'true' | 'false'>('all')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [restaurantMissing, setRestaurantMissing] = useState(false)

  useEffect(() => {
    async function loadInitialData() {
      if (!token) {
        setLoading(false)
        return
      }

      setErrorMessage('')
      setRestaurantMissing(false)

      try {
        const [categoriesResponse, dishesResponse] = await Promise.all([
          categoriesService.list(token),
          dishesService.list(token),
        ])
        setCategories(categoriesResponse)
        setDishes(dishesResponse)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setRestaurantMissing(true)
        } else {
          const message = error instanceof Error ? error.message : 'No fue posible cargar platos'
          setErrorMessage(message)
        }
      } finally {
        setLoading(false)
      }
    }

    void loadInitialData()
  }, [token])

  const dishesWithCategory = useMemo(() => {
    const categoryMap = new Map(categories.map((entry) => [entry.id, entry.name]))

    return dishes.map((dish) => ({
      ...dish,
      categoryName: categoryMap.get(dish.category_id) || 'Sin categoría',
    }))
  }, [categories, dishes])

  const filteredDishes = useMemo(() => {
    return dishesWithCategory.filter((dish) => {
      if (selectedCategoryId !== 'all' && dish.category_id !== selectedCategoryId) {
        return false
      }

      if (availabilityFilter === 'true' && !dish.available) {
        return false
      }

      if (availabilityFilter === 'false' && dish.available) {
        return false
      }

      if (!searchText.trim()) {
        return true
      }

      const needle = searchText.trim().toLowerCase()
      return dish.name.toLowerCase().includes(needle)
    })
  }, [availabilityFilter, dishesWithCategory, searchText, selectedCategoryId])

  async function toggleAvailability(dish: Dish) {
    if (!token) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    try {
      const updated = await dishesService.updateAvailability(token, dish.id, !dish.available)
      setDishes((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
      setSuccessMessage('Disponibilidad actualizada')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible actualizar disponibilidad'
      setErrorMessage(message)
    }
  }

  async function removeDish(dishId: string) {
    if (!token) {
      return
    }

    const confirmed = window.confirm('¿Seguro que deseas eliminar este plato?')
    if (!confirmed) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    try {
      await dishesService.remove(token, dishId)
      setDishes((prev) => prev.filter((entry) => entry.id !== dishId))
      setSuccessMessage('Plato eliminado correctamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible eliminar plato'
      setErrorMessage(message)
    }
  }

  if (loading) {
    return (
      <section className="content-grid">
        <article className="card">
          <h1 className="title">Gestión de Platos</h1>
          <p className="muted">Cargando platos...</p>
        </article>
      </section>
    )
  }

  if (restaurantMissing) {
    return (
      <section className="content-grid">
        <article className="card">
          <h1 className="title">Gestión de Platos</h1>
          <p className="muted">Primero debes crear tu restaurante y categorías para gestionar platos.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" to="/admin/restaurant">
              Ir a Mi Restaurante
            </Link>
            <Link className="btn btn-ghost" to="/admin/categories">
              Ir a Categorías
            </Link>
          </div>
        </article>
      </section>
    )
  }

  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">Gestión de Platos</h1>
        <p className="muted">Listado, filtros y cambios rápidos de disponibilidad.</p>
      </article>

      <article className="card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <input
            style={{ flex: 1, minWidth: 220 }}
            placeholder="Buscar plato..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          <select value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)}>
            <option value="all">Todas categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value as 'all' | 'true' | 'false')}>
            <option value="all">Todos</option>
            <option value="true">Disponibles</option>
            <option value="false">No disponibles</option>
          </select>

          <Link to="/admin/dishes/new" className="btn btn-primary">
            Nuevo plato
          </Link>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {filteredDishes.map((dish) => (
            <div
              key={dish.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                border: '1px solid var(--lm-slate-200)',
                borderRadius: 10,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong>{dish.name}</strong>
                <p className="muted">
                  {formatMoney(dish.price)} · {dish.categoryName}
                </p>
                {dish.price_offer !== null && <p className="muted">Oferta: {formatMoney(dish.price_offer)}</p>}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost" type="button" onClick={() => toggleAvailability(dish)}>
                  {dish.available ? 'Marcar no disponible' : 'Marcar disponible'}
                </button>
                <Link className="btn btn-ghost" to={`/admin/dishes/${dish.id}/edit`}>
                  Editar
                </Link>
                <button className="btn btn-ghost" type="button" onClick={() => removeDish(dish.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDishes.length === 0 && <p className="muted">No hay platos para los filtros seleccionados.</p>}
      </article>
    </section>
  )
}
