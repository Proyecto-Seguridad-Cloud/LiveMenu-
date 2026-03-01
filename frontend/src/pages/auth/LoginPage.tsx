import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Debes ingresar correo y contraseña')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authService.login({
        email: email.trim(),
        password,
      })
      login(response.access_token)
      navigate('/admin', { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible iniciar sesión'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-wrap">
      <section className="card auth-card">
        <h1 className="auth-title">Bienvenido a LiveMenu</h1>
        <p className="auth-subtitle">Ingresa para administrar restaurante, platos y QR.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="nombre@restaurante.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 12 }}>
          ¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--lm-orange-600)', fontWeight: 700 }}>Regístrate</Link>
        </p>
      </section>
    </div>
  )
}
