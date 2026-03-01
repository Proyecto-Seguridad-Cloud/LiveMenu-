import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import { fetchQrBlob, type QrFormat, type QrSize } from '../../services/qr'
import { restaurantService } from '../../services/restaurant'

const SIZE_OPTIONS: { key: QrSize; label: string }[] = [
  { key: 'sm', label: 'S' },
  { key: 'md', label: 'M' },
  { key: 'lg', label: 'L' },
  { key: 'xl', label: 'XL' },
]

const FORMAT_OPTIONS: { key: QrFormat; label: string }[] = [
  { key: 'png', label: 'PNG' },
  { key: 'svg', label: 'SVG' },
]

export function QrPage() {
  const { token } = useAuth()

  const [size, setSize] = useState<QrSize>('md')
  const [format, setFormat] = useState<QrFormat>('png')
  const [previewUrl, setPreviewUrl] = useState('')
  const [restaurantSlug, setRestaurantSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [restaurantMissing, setRestaurantMissing] = useState(false)

  const menuUrl = useMemo(() => {
    if (!restaurantSlug) {
      return ''
    }
    return `${API_BASE_URL}/m/${restaurantSlug}`
  }, [restaurantSlug])

  useEffect(() => {
    let active = true
    let currentObjectUrl = ''

    async function loadQr() {
      if (!token) {
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')
      setSuccessMessage('')
      setRestaurantMissing(false)

      try {
        const restaurant = await restaurantService.getCurrent(token)
        if (!active) {
          return
        }
        setRestaurantSlug(restaurant.slug)

        const blob = await fetchQrBlob(token, format, size)
        if (!active) {
          return
        }

        currentObjectUrl = URL.createObjectURL(blob)
        setPreviewUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev)
          }
          return currentObjectUrl
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No fue posible cargar el QR'
        if (message.toLowerCase().includes('restaurante no encontrado')) {
          setRestaurantMissing(true)
        } else {
          setErrorMessage(message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadQr()

    return () => {
      active = false
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl)
      }
    }
  }, [token, format, size])

  function handleDownload() {
    if (!previewUrl || !restaurantSlug) {
      return
    }

    const link = document.createElement('a')
    link.href = previewUrl
    link.download = `menu-${restaurantSlug}-${size}.${format}`
    link.click()
  }

  async function handleCopyMenuUrl() {
    if (!menuUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(menuUrl)
      setSuccessMessage('Enlace del menú copiado al portapapeles')
    } catch {
      setErrorMessage('No fue posible copiar el enlace del menú')
    }
  }

  if (loading) {
    return (
      <section className="content-grid">
        <article className="card">
          <h1 className="title">Mi Código QR</h1>
          <p className="muted">Cargando QR...</p>
        </article>
      </section>
    )
  }

  if (restaurantMissing) {
    return (
      <section className="content-grid">
        <article className="card">
          <h1 className="title">Mi Código QR</h1>
          <p className="muted">Debes crear tu restaurante antes de generar el código QR.</p>
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
        <h1 className="title">Mi Código QR</h1>
        <p className="muted">Descarga QR por formato y tamaño.</p>
      </article>

      <article className="card">
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            border: '1px solid var(--lm-slate-200)',
            borderRadius: 12,
            marginBottom: 14,
          }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa QR" style={{ width: 180, height: 180, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 180, height: 180, background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }} />
          )}
          <p className="muted">Preview QR</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {SIZE_OPTIONS.map((option) => (
            <button
              key={option.key}
              className={`btn ${size === option.key ? 'btn-primary' : 'btn-ghost'}`}
              type="button"
              onClick={() => setSize(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {FORMAT_OPTIONS.map((option) => (
            <button
              key={option.key}
              className={`btn ${format === option.key ? 'btn-primary' : 'btn-ghost'}`}
              type="button"
              onClick={() => setFormat(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="button" onClick={handleDownload} disabled={!previewUrl}>
            Descargar
          </button>
          <button className="btn btn-ghost" type="button" onClick={handleCopyMenuUrl} disabled={!menuUrl}>
            Copiar enlace
          </button>
          {menuUrl && (
            <a className="btn btn-ghost" href={menuUrl} target="_blank" rel="noreferrer">
              Abrir menú
            </a>
          )}
        </div>
      </article>
    </section>
  )
}
