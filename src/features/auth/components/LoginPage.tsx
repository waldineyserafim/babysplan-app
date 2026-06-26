import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import { supabase } from '@/infrastructure/supabase/client'
import { ROUTES } from '@/shared/constants/routes'
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
})
type LoginData = z.infer<typeof loginSchema>
type ForgotData = z.infer<typeof forgotSchema>

export function LoginPage() {
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) })
  const forgotForm = useForm<ForgotData>({ resolver: zodResolver(forgotSchema) })

  async function onLogin(data: LoginData) {
    setError(null)
    const { error } = await signInWithEmail(data.email, data.password)
    if (error) {
      setError('Email ou senha incorretos. Tente novamente.')
    }
    // PublicRoute redirects to dashboard automatically when isAuthenticated becomes true
  }

  async function onForgot(data: ForgotData) {
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError('Não foi possível enviar o email. Verifique o endereço e tente novamente.')
      return
    }
    setForgotSent(true)
  }

  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError('Não foi possível iniciar o login com Google. Tente novamente.')
      setGoogleLoading(false)
    }
  }

  // ── Forgot password sent ──
  if (forgotSent) {
    return (
      <>
        <div className="text-center mb-3">
          <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: 52, height: 52, background: '#d1fae5' }}>
            <span style={{ fontSize: '1.5rem' }}>✉️</span>
          </div>
          <h2 className="fw-bold mb-1" style={{ fontSize: '1.15rem' }}>Email enviado!</h2>
          <p className="text-muted small">
            Verifique sua caixa de entrada e clique no link para redefinir sua senha.
          </p>
        </div>
        <button
          className="btn w-100 btn-light"
          onClick={() => { setForgotMode(false); setForgotSent(false) }}
        >
          Voltar para o login
        </button>
      </>
    )
  }

  // ── Forgot password form ──
  if (forgotMode) {
    return (
      <>
        <button
          type="button"
          className="btn btn-link p-0 mb-3 d-flex align-items-center gap-1 text-muted small"
          onClick={() => { setForgotMode(false); setError(null) }}
        >
          <ArrowLeft size={14} /> Voltar
        </button>

        <h2 className="fw-bold mb-1 text-center" style={{ fontSize: '1.25rem' }}>Esqueci minha senha</h2>
        <p className="text-muted text-center small mb-4">Enviaremos um link para redefinir sua senha</p>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={forgotForm.handleSubmit(onForgot)}>
          <div className="mb-4">
            <label className="form-label small fw-semibold">Email da conta</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Mail size={16} className="text-muted" />
              </span>
              <input
                {...forgotForm.register('email')}
                type="email"
                className={`form-control border-start-0 ${forgotForm.formState.errors.email ? 'is-invalid' : ''}`}
                placeholder="seu@email.com"
              />
            </div>
            {forgotForm.formState.errors.email && (
              <div className="text-danger small mt-1">{forgotForm.formState.errors.email.message}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn w-100 text-white fw-semibold"
            style={{ background: '#0D9488', borderRadius: 14 }}
            disabled={forgotForm.formState.isSubmitting}
          >
            {forgotForm.formState.isSubmitting && <span className="spinner-border spinner-border-sm me-2" />}
            Enviar link de recuperação
          </button>
        </form>
      </>
    )
  }

  // ── Login form ──
  return (
    <>
      <h2 className="fw-bold mb-1 text-center" style={{ fontSize: '1.25rem' }}>Entrar</h2>
      <p className="text-muted text-center small mb-4">Acesse sua conta Baby's Plan</p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <form onSubmit={loginForm.handleSubmit(onLogin)}>
        <div className="mb-3">
          <label htmlFor="login-email" className="form-label small fw-semibold">Email</label>
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <Mail size={16} className="text-muted" />
            </span>
            <input
              {...loginForm.register('email')}
              id="login-email"
              type="email"
              className={`form-control border-start-0 ${loginForm.formState.errors.email ? 'is-invalid' : ''}`}
              placeholder="seu@email.com"
            />
          </div>
          {loginForm.formState.errors.email && (
            <div className="text-danger small mt-1">{loginForm.formState.errors.email.message}</div>
          )}
        </div>

        <div className="mb-2">
          <label htmlFor="login-password" className="form-label small fw-semibold">Senha</label>
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <Lock size={16} className="text-muted" />
            </span>
            <input
              {...loginForm.register('password')}
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className={`form-control border-start-0 border-end-0 ${loginForm.formState.errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="input-group-text bg-light"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} className="text-muted" /> : <Eye size={16} className="text-muted" />}
            </button>
          </div>
          {loginForm.formState.errors.password && (
            <div className="text-danger small mt-1">{loginForm.formState.errors.password.message}</div>
          )}
        </div>

        <div className="text-end mb-4">
          <button
            type="button"
            className="btn btn-link p-0 small"
            style={{ color: '#7c3aed', textDecoration: 'none' }}
            onClick={() => { setForgotMode(true); setError(null) }}
          >
            Esqueci minha senha
          </button>
        </div>

        <button
          type="submit"
          className="btn w-100 text-white fw-semibold mb-3"
          style={{ background: '#0D9488', borderRadius: 14 }}
          disabled={loginForm.formState.isSubmitting}
        >
          {loginForm.formState.isSubmitting && <span className="spinner-border spinner-border-sm me-2" />}
          Entrar
        </button>
      </form>

      <div className="text-center mb-3">
        <span className="text-muted small">ou</span>
      </div>

      <button
        type="button"
        className="btn btn-outline-secondary w-100 mb-4 d-flex align-items-center justify-content-center gap-2"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <span className="spinner-border spinner-border-sm" />
        ) : (
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            width={18}
          />
        )}
        Continuar com Google
      </button>

      <div className="text-center small">
        <span className="text-muted">Não tem conta? </span>
        <Link to={ROUTES.REGISTER} style={{ color: '#7c3aed' }}>Criar conta</Link>
      </div>
    </>
  )
}
