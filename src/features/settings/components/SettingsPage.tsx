import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { useAuth } from '@/shared/hooks/useAuth'
import { useCurrentPregnancy } from '@/shared/hooks/useCurrentPregnancy'
import { Copy, Check, UserPlus, Users, Trash2, Settings, Baby } from 'lucide-react'
import {
  createInvitation,
  cancelInvitation,
  fetchActiveInvitations,
  fetchTenantPartners,
  fetchTenantInfo,
  updateProfile,
  updatePregnancy,
} from '../services/settingsService'

const SEX_OPTIONS = [
  { value: 'unknown' as const, emoji: '🔮', label: 'Surpresa' },
  { value: 'male' as const, emoji: '👦', label: 'Menino' },
  { value: 'female' as const, emoji: '👧', label: 'Menina' },
]

const APP_BASE = window.location.origin

export function SettingsPage() {
  const { profile } = useAuth()
  const { data: pregnancy } = useCurrentPregnancy()
  const qc = useQueryClient()
  const [copied, setCopied] = useState<string | null>(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [invitedName, setInvitedName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(profile?.full_name ?? '')
  const [editingPregnancy, setEditingPregnancy] = useState(false)
  const [pregBabyName, setPregBabyName] = useState('')
  const [pregBabySex, setPregBabySex] = useState<'male' | 'female' | 'unknown'>('unknown')
  const [pregLmpDate, setPregLmpDate] = useState('')

  const tenantId = profile?.tenant_id

  const { data: tenant } = useQuery({
    queryKey: ['tenant-info', tenantId],
    enabled: !!tenantId,
    queryFn: () => fetchTenantInfo(tenantId!),
  })

  const { data: partners = [] } = useQuery({
    queryKey: ['tenant-partners', tenantId],
    enabled: !!tenantId,
    queryFn: () => fetchTenantPartners(tenantId!),
  })

  const { data: invitations = [] } = useQuery({
    queryKey: ['invitations', tenantId],
    enabled: !!tenantId,
    queryFn: () => fetchActiveInvitations(tenantId!),
  })

  const createInvite = useMutation({
    mutationFn: () => createInvitation(tenantId!, profile!.id, invitedName || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations', tenantId] })
      setShowInviteForm(false)
      setInvitedName('')
    },
  })

  const cancelInvite = useMutation({
    mutationFn: (code: string) => cancelInvitation(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations', tenantId] }),
  })

  const saveName = useMutation({
    mutationFn: () => updateProfile(profile!.id, { full_name: newName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      setEditingName(false)
    },
  })

  const savePregnancy = useMutation({
    mutationFn: () => {
      const due = format(addDays(new Date(pregLmpDate), 280), 'yyyy-MM-dd')
      return updatePregnancy(pregnancy!.id, {
        baby_name: pregBabyName,
        baby_sex: pregBabySex,
        lmp_date: pregLmpDate,
        due_date: due,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['current-pregnancy'] })
      setEditingPregnancy(false)
    },
  })

  function openPregEdit() {
    setPregBabyName(pregnancy?.baby_name ?? '')
    setPregBabySex((pregnancy?.baby_sex as 'male' | 'female' | 'unknown') ?? 'unknown')
    setPregLmpDate(pregnancy?.lmp_date ?? '')
    setEditingPregnancy(true)
  }

  async function copyInviteLink(code: string) {
    const url = `${APP_BASE}/join/${code}`
    await navigator.clipboard.writeText(url)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const pendingInvites = invitations.filter(i => i.status === 'pending')
  const isExpired = (inv: typeof invitations[0]) => new Date(inv.expires_at) < new Date()
  const otherPartners = (partners as Array<{ id: string; full_name: string; role: string }>).filter(p => p.id !== profile?.id)

  if (!profile || !tenantId) return null

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <Settings size={20} style={{ color: '#7c3aed' }} />
        <h4 className="fw-bold mb-0">Configurações</h4>
      </div>

      {/* ── Meu perfil ── */}
      <div className="card border-0 shadow-sm p-4 mb-4">
        <h6 className="fw-bold mb-3">Meu Perfil</h6>
        <div className="d-flex align-items-center gap-3 mb-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
            style={{ width: 52, height: 52, fontSize: '1.25rem', background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
          >
            {profile.full_name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div>
            {editingName ? (
              <div className="d-flex gap-2 align-items-center">
                <input
                  className="form-control form-control-sm"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ maxWidth: 200 }}
                />
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => saveName.mutate()}
                  disabled={saveName.isPending}
                >
                  Salvar
                </button>
                <button className="btn btn-sm btn-light" onClick={() => setEditingName(false)}>Cancelar</button>
              </div>
            ) : (
              <div className="fw-semibold">{profile.full_name}</div>
            )}
            <div className="text-muted small">{profile.role === 'partner' ? 'Parceiro(a)' : profile.role === 'platform_admin' ? 'Administrador' : 'Familiar'}</div>
          </div>
          {!editingName && (
            <button className="btn btn-sm btn-light ms-auto" onClick={() => setEditingName(true)}>
              Editar nome
            </button>
          )}
        </div>
      </div>

      {/* ── Família ── */}
      <div className="card border-0 shadow-sm p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <Users size={16} style={{ color: '#7c3aed' }} />
          <h6 className="fw-bold mb-0">Família — {tenant?.name}</h6>
        </div>

        {otherPartners.length > 0 ? (
          <div className="mb-3">
            <div className="small text-muted fw-semibold mb-2">COMPARTILHANDO COM</div>
            {otherPartners.map(p => (
              <div key={p.id} className="d-flex align-items-center gap-2 py-2 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                  style={{ width: 36, height: 36, fontSize: '0.875rem', background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)' }}
                >
                  {p.full_name?.charAt(0).toUpperCase() ?? 'P'}
                </div>
                <div>
                  <div className="fw-semibold small">{p.full_name}</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Parceiro(a)</div>
                </div>
                <span className="badge bg-success ms-auto">Ativo</span>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-3 p-3 mb-3 text-center"
            style={{ background: '#f8fafc', border: '1px dashed #e2e8f0' }}
          >
            <div className="text-muted small mb-1">Nenhum parceiro(a) ainda</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              Convide seu parceiro(a) para compartilharem a gestação
            </div>
          </div>
        )}

        {/* Convites pendentes */}
        {pendingInvites.length > 0 && (
          <div className="mb-3">
            <div className="small text-muted fw-semibold mb-2">CONVITES ATIVOS</div>
            {pendingInvites.map(inv => (
              <div key={inv.id} className="d-flex align-items-center gap-2 p-2 rounded-3 mb-2"
                style={{ background: isExpired(inv) ? '#fef2f2' : '#f0fdf4', border: '1px solid', borderColor: isExpired(inv) ? '#fecaca' : '#bbf7d0' }}>
                <div className="flex-grow-1">
                  <div className="small fw-semibold">
                    {inv.invited_name ? `Para: ${inv.invited_name}` : 'Convite sem nome'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                    {isExpired(inv) ? '⚠️ Expirado' : `Válido até ${new Date(inv.expires_at).toLocaleDateString('pt-BR')}`}
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                  onClick={() => copyInviteLink(inv.invite_code)}
                  title="Copiar link"
                >
                  {copied === inv.invite_code ? <Check size={12} /> : <Copy size={12} />}
                  <span className="d-none d-sm-inline">{copied === inv.invite_code ? 'Copiado!' : 'Copiar link'}</span>
                </button>
                <button
                  className="btn btn-sm btn-outline-danger d-flex align-items-center"
                  onClick={() => cancelInvite.mutate(inv.invite_code)}
                  disabled={cancelInvite.isPending}
                  title="Cancelar convite"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Criar convite */}
        {showInviteForm ? (
          <div className="rounded-3 p-3" style={{ background: '#ede9fe' }}>
            <div className="small fw-semibold mb-2" style={{ color: '#7c3aed' }}>Novo convite</div>
            <input
              className="form-control form-control-sm mb-2"
              placeholder="Nome do parceiro(a) (opcional)"
              value={invitedName}
              onChange={e => setInvitedName(e.target.value)}
            />
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm text-white"
                style={{ background: '#0D9488', borderRadius: 10 }}
                onClick={() => createInvite.mutate()}
                disabled={createInvite.isPending}
              >
                {createInvite.isPending ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                Gerar link de convite
              </button>
              <button className="btn btn-sm btn-light" onClick={() => setShowInviteForm(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button
            className="btn d-flex align-items-center gap-2 fw-semibold"
            style={{ background: 'linear-gradient(135deg, #ede9fe, #fce7f3)', color: '#7c3aed', border: 'none' }}
            onClick={() => setShowInviteForm(true)}
          >
            <UserPlus size={16} />
            Convidar parceiro(a)
          </button>
        )}
      </div>

      {/* ── Convites aceitos (histórico) ── */}
      {invitations.filter(i => i.status === 'accepted').length > 0 && (
        <div className="card border-0 shadow-sm p-4 mb-4">
          <h6 className="fw-bold mb-3">Histórico de convites</h6>
          {invitations.filter(i => i.status === 'accepted').map(inv => (
            <div key={inv.id} className="d-flex align-items-center gap-2 py-2 border-bottom text-muted small">
              <Check size={14} className="text-success flex-shrink-0" />
              <span>{inv.invited_name ?? 'Convite'} — aceito em {new Date(inv.updated_at ?? inv.created_at ?? '').toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Dados da gestação ── */}
      {pregnancy && (
        <div className="card border-0 shadow-sm p-4 mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Baby size={16} style={{ color: '#0D9488' }} />
            <h6 className="fw-bold mb-0">Dados da Gestação</h6>
            {!editingPregnancy && (
              <button className="btn btn-sm btn-light ms-auto" onClick={openPregEdit}>
                Editar
              </button>
            )}
          </div>

          {editingPregnancy ? (
            <div>
              {savePregnancy.isError && (
                <div className="alert alert-danger py-2 small mb-3">Erro ao salvar. Tente novamente.</div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold small">Nome carinhoso do bebê</label>
                <input
                  className="form-control form-control-sm"
                  value={pregBabyName}
                  onChange={e => setPregBabyName(e.target.value)}
                  placeholder="Ex: Bebê, Aurora, Miguelzinho..."
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">Sexo do bebê</label>
                <div className="d-flex gap-2">
                  {SEX_OPTIONS.map(opt => {
                    const selected = pregBabySex === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPregBabySex(opt.value)}
                        className="flex-fill border-0 rounded-3 py-2 px-2 d-flex flex-column align-items-center"
                        style={{
                          cursor: 'pointer',
                          outline: selected ? '2px solid #0D9488' : '2px solid #e2e8f0',
                          background: selected ? '#f0fdfa' : '#f8fafc',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{opt.emoji}</span>
                        <span className="small fw-semibold mt-1" style={{ color: selected ? '#0D9488' : '#64748b' }}>
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">Data da última menstruação (DUM)</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={pregLmpDate}
                  onChange={e => setPregLmpDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                {pregLmpDate && (
                  <div className="mt-2 p-2 rounded-3 text-center small"
                    style={{ background: '#f0fdfa', color: '#0D9488' }}>
                    🍼 Data provável do parto:{' '}
                    <strong>{format(addDays(new Date(pregLmpDate), 280), 'dd/MM/yyyy')}</strong>
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm text-white"
                  style={{ background: '#0D9488', borderRadius: 10 }}
                  onClick={() => savePregnancy.mutate()}
                  disabled={savePregnancy.isPending || !pregBabyName.trim() || !pregLmpDate}
                >
                  {savePregnancy.isPending ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                  Salvar alterações
                </button>
                <button className="btn btn-sm btn-light" onClick={() => setEditingPregnancy(false)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Nome do bebê</span>
                <span className="fw-semibold">{pregnancy.baby_name ?? '—'}</span>
              </div>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Sexo</span>
                <span className="fw-semibold">
                  {pregnancy.baby_sex === 'male' ? '👦 Menino' : pregnancy.baby_sex === 'female' ? '👧 Menina' : '🔮 Surpresa'}
                </span>
              </div>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">DUM</span>
                <span className="fw-semibold">
                  {pregnancy.lmp_date ? new Date(pregnancy.lmp_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                </span>
              </div>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Data provável do parto</span>
                <span className="fw-semibold">
                  {pregnancy.due_date ? new Date(pregnancy.due_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── App info ── */}
      <div className="card border-0 shadow-sm p-4">
        <h6 className="fw-bold mb-3">Sobre o Baby's Plan</h6>
        <div className="text-muted small">
          <div className="mb-1">Versão: <strong>Sprint 9</strong></div>
          <div className="mb-1">Família: <strong>{tenant?.name}</strong></div>
          <div>Sincronização em tempo real ativa ✓</div>
        </div>
      </div>
    </div>
  )
}
