import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { Button } from '../widgets/Button/Button'
import { GlassCard } from '../widgets/GlassCard/GlassCard'
import { TextField } from '../widgets/TextField/TextField'
import './pages.css'

export function LoginPage() {
  const { isAuthenticated, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setError('E-posta veya şifre hatalı.')
      } else {
        setError(caught instanceof Error ? caught.message : 'Giriş başarısız.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page page--public login-page">
      <GlassCard eyebrow="Yönetici Konsolu" title="Admin Girişi" icon="lock_open">
        <form className="stack" onSubmit={handleSubmit} noValidate>
          <TextField
            label="E-posta"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <TextField
            label="Şifre"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && (
            <p className="form-message form-message--error" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            icon="login"
            block
            loading={submitting}
            disabled={!email.trim() || !password}
          >
            Giriş Yap
          </Button>
        </form>
      </GlassCard>
    </div>
  )
}
