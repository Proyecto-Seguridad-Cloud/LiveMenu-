import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { categoriesService } from '../../services/categories'
import { ApiError } from '../../services/http'
import type { Category } from '../../types/category'

export function CategoriesPage() {
  const { token } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingOrder, setSavingOrder] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [restaurantMissing, setRestaurantMissing] = useState(false)

  const canSaveOrder = useMemo(() => categories.length > 1, [categories.length])

  useEffect(() => {
    async function loadCategories() {
      if (!token) {
        setLoading(false)
        return
      }

      setErrorMessage('')
      try {
        const response = await categoriesService.list(token)
        setCategories(response)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setRestaurantMissing(true)
        } else {
          const message = error instanceof Error ? error.message : 'No fue posible cargar categorías'
          setErrorMessage(message)
        }
      } finally {
        setLoading(false)
      }
    }

    void loadCategories()
  }, [token])

  function moveCategory(categoryId: string, direction: 'up' | 'down') {
    setCategories((prev) => {
      const index = prev.findIndex((item) => item.id === categoryId)
      if (index === -1) {
        return prev
      }
      if (direction === 'up' && index === 0) {
        return prev
      }
      if (direction === 'down' && index === prev.length - 1) {
        return prev
      }

      const newIndex = direction === 'up' ? index - 1 : index + 1
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(newIndex, 0, item)
      return next.map((entry, idx) => ({ ...entry, position: idx + 1 }))
    })
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    if (!newName.trim()) {
      setErrorMessage('El nombre de categoría es obligatorio')
      return
    }

    try {
      setCreating(true)
      const created = await categoriesService.create(token, {
        name: newName.trim(),
        description: newDescription.trim() || null,
      })

      setCategories((prev) => [...prev, created])
      setNewName('')
      setNewDescription('')
      setSuccessMessage('Categoría creada correctamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible crear categoría'
      setErrorMessage(message)
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(category: Category) {
    if (!token) {
      return
    }

    setErrorMessage('')
    try {
      const updated = await categoriesService.update(token, category.id, { active: !category.active })
      setCategories((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible actualizar estado'
      setErrorMessage(message)
    }
  }

  async function handleDelete(categoryId: string) {
    if (!token) {
      return
    }
    const confirmed = window.confirm('¿Seguro que deseas eliminar esta categoría?')
    if (!confirmed) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    try {
      await categoriesService.remove(token, categoryId)
      setCategories((prev) => prev.filter((item) => item.id !== categoryId).map((entry, idx) => ({ ...entry, position: idx + 1 })))
      setSuccessMessage('Categoría eliminada correctamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible eliminar categoría'
      setErrorMessage(message)
    }
  }

  async function handleSaveOrder() {
    if (!token || !canSaveOrder) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    try {
      setSavingOrder(true)
      const ordered = await categoriesService.reorder(
        token,
        categories.map((item) => item.id),
      )
      setCategories(ordered)
      setSuccessMessage('Orden guardado correctamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible guardar orden'
      setErrorMessage(message)
    } finally {
      setSavingOrder(false)
    }
  }

  if (loading) {
    return (
      <section className="content-grid">
        <article className="card">
          <h1 className="title">Categorías</h1>
          <p className="muted">Cargando categorías...</p>
        </article>
      </section>
    )
  }

  if (restaurantMissing) {
    return (
      <section className="content-grid">
        <article className="card">
          <h1 className="title">Categorías</h1>
          <p className="muted">Primero debes crear tu restaurante para gestionar categorías.</p>
          <Link className="btn btn-primary" to="/admin/restaurant">
            Ir a Mi Restaurante
          </Link>
        </article>
      </section>
    )
  }

  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">Categorías</h1>
        <p className="muted">Crear, activar/desactivar, eliminar y reordenar categorías.</p>
      </article>

      <article className="card">
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="categoryName">Nueva categoría</label>
            <input
              id="categoryName"
              placeholder="Ej: Entradas"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="categoryDescription">Descripción</label>
            <input
              id="categoryDescription"
              placeholder="Opcional"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
            />
          </div>

          <div>
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? 'Creando...' : 'Agregar categoría'}
            </button>
          </div>
        </form>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {categories.map((category, index) => (
            <div key={category.id} style={{ display: 'grid', gap: 8, padding: 10, border: '1px solid var(--lm-slate-200)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <strong>{category.name}</strong>
                  <p className="muted">Posición #{index + 1}</p>
                </div>
                <span className="status-chip">{category.active ? 'Activa' : 'Inactiva'}</span>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost" type="button" onClick={() => moveCategory(category.id, 'up')} disabled={index === 0}>
                  Subir
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => moveCategory(category.id, 'down')}
                  disabled={index === categories.length - 1}
                >
                  Bajar
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => toggleActive(category)}>
                  {category.active ? 'Desactivar' : 'Activar'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => handleDelete(category.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {categories.length === 0 && <p className="muted">Aún no hay categorías creadas.</p>}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" type="button" onClick={handleSaveOrder} disabled={!canSaveOrder || savingOrder}>
            {savingOrder ? 'Guardando...' : 'Guardar orden'}
          </button>
        </div>
      </article>
    </section>
  )
}
