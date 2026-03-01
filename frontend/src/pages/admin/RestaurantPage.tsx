import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { restaurantService } from '../../services/restaurant'
import { ApiError } from '../../services/http'
import type { RestaurantPayload } from '../../types/restaurant'

export function RestaurantPage() {
  const { token } = useAuth()

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [hoursRaw, setHoursRaw] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const hasRestaurant = useMemo(() => Boolean(restaurantId), [restaurantId])

  useEffect(() => {
    async function loadRestaurant() {
      if (!token) {
        setLoading(false)
        return
      }

      setErrorMessage('')
      setSuccessMessage('')

      try {
        const restaurant = await restaurantService.getCurrent(token)
        setRestaurantId(restaurant.id)
        setSlug(restaurant.slug)
        setName(restaurant.name)
        setDescription(restaurant.description || '')
        setLogoUrl(restaurant.logo_url || '')
        setPhone(restaurant.phone || '')
        setAddress(restaurant.address || '')
        setHoursRaw(restaurant.hours ? JSON.stringify(restaurant.hours, null, 2) : '')
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setRestaurantId(null)
          setSlug('')
          return
        }
        const message = error instanceof Error ? error.message : 'No fue posible cargar restaurante'
        setErrorMessage(message)
      } finally {
        setLoading(false)
      }
    }

    void loadRestaurant()
  }, [token])

  function buildPayload(): RestaurantPayload | null {
    if (!name.trim()) {
      setErrorMessage('El nombre del restaurante es obligatorio')
      return null
    }

    let parsedHours: Record<string, unknown> | null = null
    if (hoursRaw.trim()) {
      try {
        const parsed = JSON.parse(hoursRaw)
        parsedHours = typeof parsed === 'object' && parsed !== null ? parsed : null
      } catch {
        setErrorMessage('Horarios debe ser un JSON válido')
        return null
      }
    }

    return {
      name: name.trim(),
      description: description.trim() || null,
      logo_url: logoUrl.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      hours: parsedHours,
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    const payload = buildPayload()
    if (!payload) {
      return
    }

    try {
      setSaving(true)
      const response = hasRestaurant
        ? await restaurantService.update(token, payload)
        : await restaurantService.create(token, payload)

      setRestaurantId(response.id)
      setSlug(response.slug)
      setSuccessMessage(hasRestaurant ? 'Restaurante actualizado correctamente' : 'Restaurante creado correctamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible guardar restaurante'
      setErrorMessage(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="content-grid">
        <article className="card">
          <h1 className="title">Mi Restaurante</h1>
          <p className="muted">Cargando información...</p>
        </article>
      </section>
    )
  }

  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">Mi Restaurante</h1>
        <p className="muted">Datos principales, logo, contacto, slug y horarios.</p>
      </article>

      <article className="card">
        {!hasRestaurant && (
          <p className="muted" style={{ marginBottom: 12 }}>
            Aún no tienes restaurante configurado. Completa este formulario para crearlo.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Nombre</label>
            <input id="name" placeholder="La Parrilla del Chef" value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              rows={4}
              placeholder="Especialistas en cortes y brasas."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="logo">Logo URL</label>
            <input id="logo" placeholder="https://..." value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="phone">Teléfono</label>
            <input id="phone" placeholder="+57 300 000 0000" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="address">Dirección</label>
            <input id="address" placeholder="Calle 123 #45-67" value={address} onChange={(event) => setAddress(event.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="hours">Horarios (JSON opcional)</label>
            <textarea
              id="hours"
              rows={4}
              placeholder='{"lunes":"8:00-18:00"}'
              value={hoursRaw}
              onChange={(event) => setHoursRaw(event.target.value)}
            />
          </div>

          {hasRestaurant && (
            <div className="field">
              <label htmlFor="slug">Slug (solo lectura)</label>
              <input id="slug" readOnly value={slug} />
            </div>
          )}

          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : hasRestaurant ? 'Guardar cambios' : 'Crear restaurante'}
            </button>
            {slug && (
              <Link className="btn btn-ghost" to={`/m/${slug}`} target="_blank" rel="noreferrer">
                Ver menú público
              </Link>
            )}
          </div>
        </form>
      </article>
    </section>
  )
}
