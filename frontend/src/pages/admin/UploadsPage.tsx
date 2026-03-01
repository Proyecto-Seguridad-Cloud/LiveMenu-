import type { ChangeEvent } from 'react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { uploadsService } from '../../services/uploads'
import type { UploadImageResponse } from '../../types/upload'

const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function UploadsPage() {
  const { token } = useAuth()

  const [uploads, setUploads] = useState<UploadImageResponse[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSelectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !token) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Tipo no permitido. Usa JPG, PNG o WebP.')
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`El archivo supera el límite de ${MAX_SIZE_MB}MB.`)
      return
    }

    try {
      setUploading(true)
      const response = await uploadsService.uploadImage(token, file)
      setUploads((prev) => [response, ...prev])
      setSuccessMessage('Imagen subida correctamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible subir la imagen'
      setErrorMessage(message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(fileId: string) {
    if (!token) {
      return
    }

    const confirmed = window.confirm('¿Eliminar esta imagen y sus variantes?')
    if (!confirmed) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    try {
      setDeletingFileId(fileId)
      await uploadsService.deleteImage(token, fileId)
      setUploads((prev) => prev.filter((entry) => entry.file_id !== fileId))
      setSuccessMessage('Imagen eliminada correctamente')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible eliminar la imagen'
      setErrorMessage(message)
    } finally {
      setDeletingFileId(null)
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setSuccessMessage('URL copiada al portapapeles')
    } catch {
      setErrorMessage('No fue posible copiar la URL')
    }
  }

  return (
    <section className="content-grid">
      <article className="card">
        <h1 className="title">Gestión de Imágenes</h1>
        <p className="muted">Subida de JPG/PNG/WebP con máximo 5MB.</p>
      </article>

      <article className="card">
        <div style={{ border: '2px dashed var(--lm-orange-100)', borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 14 }}>
          <p style={{ marginTop: 0, fontWeight: 700 }}>Zona de carga</p>
          <p className="muted">Selecciona una imagen para generar variantes thumbnail, medium y large.</p>
          <label className="btn btn-primary" style={{ display: 'inline-block' }}>
            {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={handleSelectFile}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {uploads.map((item) => (
            <div key={item.file_id} style={{ border: '1px solid var(--lm-slate-200)', borderRadius: 10, padding: 10 }}>
              <p style={{ marginTop: 0, marginBottom: 6, fontWeight: 700 }}>{item.original_filename}</p>
              <p className="muted" style={{ marginBottom: 8 }}>
                ID: {item.file_id}
              </p>

              <div style={{ display: 'grid', gap: 8 }}>
                {Object.entries(item.urls).map(([variant, url]) => (
                  <div key={variant} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="status-chip">{variant}</span>
                    <a href={url} target="_blank" rel="noreferrer" className="muted" style={{ wordBreak: 'break-all' }}>
                      {url}
                    </a>
                    <button className="btn btn-ghost" type="button" onClick={() => copyUrl(url)}>
                      Copiar URL
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10 }}>
                <button className="btn btn-ghost" type="button" onClick={() => handleDelete(item.file_id)} disabled={deletingFileId === item.file_id}>
                  {deletingFileId === item.file_id ? 'Eliminando...' : 'Eliminar imagen'}
                </button>
              </div>
            </div>
          ))}

          {uploads.length === 0 && <p className="muted">Aún no hay imágenes cargadas en esta sesión.</p>}
        </div>
      </article>
    </section>
  )
}
