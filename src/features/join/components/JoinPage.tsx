import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, Users, CheckCircle, AlertCircle, LogIn } from 'lucide-react'
import { useAuth } from '@/shared/hooks/useAuth'
import { ROUTES } from '@/shared/constants/routes'
import { fetchInvitationByCode, acceptInvitation } from '@/features/settings/services/settingsService'
import type { Invitation } from '@/features/settings/services/settingsService'
import { useQueryClient } from '@tanstack/react-query'

type Status = 'loading' | 'valid' | 'invalid' | 'accepting' | 'accepted' | 'error' | 'own'

export function JoinPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading, refreshProfile } = useAuth()
  const qc = useQueryClient()

  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!code) { setStatus('invalid'); return }
    fetchInvitationByCode(code)
      .then(inv => {
        if (!inv) { setStatus('invalid'); return }
        if (inv.status !== 'pending' || new Date(inv.expires_at) < new Date()) {
          setStatus('invalid'); return
        }
        setInvitation(inv)
        setStatus('valid')
      })
      .catch(() => setStatus('invalid'))
  }, [code])

  async function handleAccept() {
    if (!code) return
    setStatus('accepting')
    try {
      const result = await acceptInvitation(code)
      if (!result.success) {
        setErrorMsg(result.error ?? 'Erro ao aceitar convite.')
        setStatus('error')
        return
      }
      // Refresh profile so tenant_id is updated across the app
      await refreshProfile()
      qc.clear()
      setStatus('accepted')
      setTimeout(() => navigate(ROUTES.DASHBOARD, { replace: true }), 2000)
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Erro ao aceitar convite.')
      setStatus('error')
    }
  }

  const isExpired = invitation ? new Date(invitation.expires_at) < new Date() : false

  // ── Loading auth ──
  if (authLoading || status === 'loading') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)' }}>
        <div className="spinner-border" style={{ color: '#7c3aed' }} />
      </div>
    )
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)' }}>
      <div className="card border-0 shadow-lg p-4 p-md-5" style={{ maxWidth: 480, width: '100%', borderRadius: 20 }}>
        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
          >
            <Heart size={32} color="white" fill="white" />
          </div>
          <h3 className="fw-bold mb-1" style={{ color: '#1e1b4b' }}>Baby Journey</h3>
          <p className="text-muted small mb-0">Compartilhamento de Gestação</p>
        </div>

        {/* ── Convite inválido ── */}
        {status === 'invalid' && (
          <div className="text-center py-3">
            <AlertCircle size={48} className="text-danger mb-3" />
            <h5 className="fw-bold">Convite inválido</h5>
            <p className="text-muted small mb-4">
              Este link de convite não é válido, já foi utilizado ou expirou.
            </p>
            <Link to={ROUTES.LOGIN} className="btn btn-primary px-4">
              Ir para o aplicativo
            </Link>
          </div>
        )}

        {/* ── Convite válido + não autenticado ── */}
        {status === 'valid' && !isAuthenticated && (
          <div className="text-center py-2">
            <Users size={40} className="mb-3" style={{ color: '#7c3aed' }} />
            <h5 className="fw-bold mb-2">Você foi convidado!</h5>
            <p className="text-muted small mb-4">
              {invitation?.invited_name
                ? `${invitation.invited_name}, você`
                : 'Você'} foi convidado(a) para compartilhar uma gestação no Baby Journey.
              {!isExpired && (
                <span className="d-block mt-1 text-muted">
                  Válido até {new Date(invitation!.expires_at).toLocaleDateString('pt-BR')}
                </span>
              )}
            </p>
            <p className="small text-muted mb-4">
              Para aceitar o convite, faça login ou crie sua conta. Depois volte a este link para confirmar.
            </p>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <Link
                to={`${ROUTES.LOGIN}?redirect=/join/${code}`}
                className="btn btn-primary d-flex align-items-center gap-2"
              >
                <LogIn size={16} />
                Entrar na conta
              </Link>
              <Link
                to={`${ROUTES.REGISTER}?redirect=/join/${code}`}
                className="btn btn-outline-primary"
              >
                Criar conta
              </Link>
            </div>
          </div>
        )}

        {/* ── Convite válido + autenticado ── */}
        {status === 'valid' && isAuthenticated && (
          <div className="text-center py-2">
            <Users size={40} className="mb-3" style={{ color: '#7c3aed' }} />
            <h5 className="fw-bold mb-2">Aceitar convite</h5>
            <div className="rounded-3 p-3 mb-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="small text-muted mb-1">Você está sendo convidado(a) para compartilhar:</div>
              <div className="fw-semibold">Gestação completa — dados em tempo real</div>
              <div className="text-muted small mt-1">
                Consultas, exames, diário, fotos, chutes e todos os módulos do aplicativo
              </div>
            </div>
            <div className="alert alert-warning small py-2 px-3 text-start mb-4">
              <strong>Atenção:</strong> Ao aceitar, seus dados atuais serão mesclados com os da família que te convidou.
            </div>
            <button
              className="btn text-white w-100 fw-semibold py-2 mb-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', borderRadius: 10 }}
              onClick={handleAccept}
            >
              <Users size={16} className="me-2" />
              Aceitar e entrar na família
            </button>
            <button className="btn btn-link text-muted small" onClick={() => navigate(ROUTES.DASHBOARD)}>
              Recusar por enquanto
            </button>
          </div>
        )}

        {/* ── Aceitando ── */}
        {status === 'accepting' && (
          <div className="text-center py-4">
            <div className="spinner-border mb-3" style={{ color: '#7c3aed' }} />
            <h5 className="fw-bold mb-2">Aceitando convite...</h5>
            <p className="text-muted small">Conectando sua conta à família</p>
          </div>
        )}

        {/* ── Aceito com sucesso ── */}
        {status === 'accepted' && (
          <div className="text-center py-4">
            <CheckCircle size={56} className="mb-3" style={{ color: '#16a34a' }} />
            <h5 className="fw-bold mb-2" style={{ color: '#16a34a' }}>Bem-vindo(a) à família!</h5>
            <p className="text-muted small mb-0">Você agora tem acesso a toda a gestação compartilhada.</p>
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 8 }}>Redirecionando...</p>
          </div>
        )}

        {/* ── Erro ── */}
        {status === 'error' && (
          <div className="text-center py-3">
            <AlertCircle size={48} className="text-danger mb-3" />
            <h5 className="fw-bold">Não foi possível aceitar</h5>
            <p className="text-muted small mb-4">{errorMsg}</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-primary" onClick={() => setStatus('valid')}>
                Tentar novamente
              </button>
              <Link to={ROUTES.DASHBOARD} className="btn btn-light">
                Ir para o app
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
