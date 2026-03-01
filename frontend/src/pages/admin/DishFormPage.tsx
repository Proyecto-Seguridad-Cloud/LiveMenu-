import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { categoriesService } from '../../services/categories'
import { dishesService } from '../../services/dishes'
import { ApiError } from '../../services/http'
import type { Category } from '../../types/category'

type DishFormPageProps = {
  mode: 'new' | 'edit'
}

const TAGS_SUGERIDOS = ['vegetariano', 'vegano', 'sin gluten', 'sin lactosa', 'picante', 'nuevo', 'recomendado', 'popular']

function toNumber(value: string): number | null {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return null
  }
  return parsed
}

export function DishFormPage({ mode }: DishFormPageProps) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [priceOffer, setPriceOffer] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [featured, setFeatured] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [restaurantMissing, setRestaurantMissing] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!token) {
        setLoading(false)
        return
      }

      setErrorMessage('')
      setRestaurantMissing(false)

      try {
        const categoryResponse = await categoriesService.list(token)
        setCategories(categoryResponse)

        if (mode === 'new') {
          if (categoryResponse.length > 0) {
            setCategoryId(categoryResponse[0].id)
          }
          return
        }

        if (!id) {
          setErrorMessage('No se encontró el identificador del plato')
          return
        }

        const dish = await dishesService.get(token, id)
        setCategoryId(dish.category_id)
        setName(dish.name)
        setDescription(dish.description ?? '')
        setPrice(String(dish.price))
        setPriceOffer(dish.price_offer === null ? '' : String(dish.price_offer))
        setImageUrl(dish.image_url ?? '')
        setTagsInput(dish.tags.join(', '))
        setFeatured(dish.featured)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setRestaurantMissing(true)
        } else {
          const message = error instanceof Error ? error.message : 'No fue posible cargar el formulario'
          setErrorMessage(message)
        }
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [id, mode, token])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      return
    }

    setErrorMessage('')

    if (!categoryId) {
      setErrorMessage('Debes seleccionar una categoría')
      return
    }

    if (!name.trim()) {
      setErrorMessage('El nombre es obligatorio')
      return
    }

    const priceValue = toNumber(price)
    if (priceValue === null || priceValue <= 0) {
      setErrorMessage('El precio base debe ser mayor a 0')
      return
    }

    const offerValue = priceOffer.trim() ? toNumber(priceOffer) : null
    if (offerValue !== null && offerValue <= 0) {
      setErrorMessage('El precio oferta debe ser mayor a 0')
      return
    }

    if (offerValue !== null && offerValue >= priceValue) {
      setErrorMessage('El precio de oferta debe ser menor que el precio base')
      return
    }

    const tags = tagsInput
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)

    try {
      setSaving(true)

      const payload = {
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || null,
        price: priceValue,
        price_offer: offerValue,
        image_url: imageUrl.trim() || null,
        featured,
        tags,
      }

      if (mode === 'new') {
        await dishesService.create(token, payload)
      } else {
        if (!id) {
          setErrorMessage('No se encontró el identificador del plato')
          return
        }
        await dishesService.update(token, id, payload)
      }

      navigate('/admin/dishes', { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible guardar el plato'
      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="content-grid">
        <article className="card">
          <h1 className="title">{mode === 'new' ? 'Nuevo Plato' : 'Editar Plato'}</h1>
          <p className="muted">Cargando formulario...</p>
        </article>
      </section>
    )
  }

  if (restaurantMissing) {
    return (
      <section className="content-grid">
        <article className="card">
          <h1 className="title">{mode === 'new' ? 'Nuevo Plato' : 'Editar Plato'}</h1>
          <p className="muted">Debes crear tu restaurante y categorías antes de gestionar platos.</p>
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

  if (categories.length === 0) {
    return (
      <section className="content-grid">
        <article className="card">
          <h1 className="title">{mode === 'new' ? 'Nuevo Plato' : 'Editar Plato'}</h1>
          <p className="muted">Necesitas al menos una categoría para crear platos.</p>
          <Link className="btn btn-primary" to="/admin/categories">
            Crear categoría
          </Link>
        </article>
      </section>
    )
  }

  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">{mode === 'new' ? 'Nuevo Plato' : 'Editar Plato'}</h1>
        <p className="muted">Completa la información principal del plato y guarda cambios.</p>
      </article>

      <article className="card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="category">Categoría</label>
            <select id="category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="name">Nombre</label>
            <input id="name" placeholder="Pizza Margherita" value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="price">Precio base</label>
            <input id="price" type="number" min="0" step="0.01" placeholder="12.50" value={price} onChange={(event) => setPrice(event.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="offer">Precio oferta</label>
            <input
              id="offer"
              type="number"
              min="0"
              step="0.01"
              placeholder="Opcional"
              value={priceOffer}
              onChange={(event) => setPriceOffer(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              rows={4}
              placeholder="Descripción corta del plato"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="imageUrl">URL de imagen</label>
            <input
              id="imageUrl"
              placeholder="http://localhost:8000/uploads/..."
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
            />
            <p className="muted">
              Puedes subir imágenes en <Link to="/admin/uploads">Gestión de Imágenes</Link> y pegar la URL `medium` o `large`.
            </p>
          </div>

          <div className="field">
            <label htmlFor="tags">Etiquetas (separadas por coma)</label>
            <input
              id="tags"
              placeholder="popular, recomendado"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
            />
            <p className="muted">Permitidas: {TAGS_SUGERIDOS.join(', ')}.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <input id="featured" type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
            <label htmlFor="featured">Marcar como destacado</label>
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <Link className="btn btn-ghost" to="/admin/dishes">
              Cancelar
            </Link>
          </div>
        </form>
      </article>
    </section>
  )
}
