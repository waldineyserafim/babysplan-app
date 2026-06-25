import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import { useCurrentPregnancy } from '@/shared/hooks/useCurrentPregnancy'
import { supabase } from '@/infrastructure/supabase/client'
import { ROUTES } from '@/shared/constants/routes'
import { addDays, format } from 'date-fns'

const schema = z.object({
  familyName: z.string().optional(),
  babyName: z.string().min(1, 'Informe um nome carinhoso para o bebê'),
  babySex: z.enum(['male', 'female', 'unknown']),
  lmpDate: z.string().min(1, 'Informe a data da última menstruação'),
})
type FormData = z.infer<typeof schema>

const SEX_OPTIONS = [
  { value: 'unknown' as const, emoji: '🔮', label: 'Surpresa' },
  { value: 'male' as const, emoji: '👦', label: 'Menino' },
  { value: 'female' as const, emoji: '👧', label: 'Menina' },
]

export function OnboardingPage() {
  const { profile, user, loading: authLoading, refreshProfile } = useAuth()
  const { data: existingPregnancy, isLoading: pregnancyLoading } = useCurrentPregnancy()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const needsProfileSetup = !authLoading && (!profile || !profile.tenant_id)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { babySex: 'unknown' },
  })

  const lmpDate = watch('lmpDate')
  const babySex = watch('babySex')
  const dueDate = lmpDate ? format(addDays(new Date(lmpDate), 280), 'dd/MM/yyyy') : null

  // Already has a pregnancy — redirect to dashboard
  if (!authLoading && !pregnancyLoading && existingPregnancy) {
    navigate(ROUTES.DASHBOARD, { replace: true })
    return null
  }

  if (authLoading || pregnancyLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: 'linear-gradient(135deg, #f0fdfa, #fce7f3)' }}>
        <div className="spinner-border bp-spinner" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    )
  }

  async function onSubmit(data: FormData) {
    setError(null)
    let tenantId = profile?.tenant_id

    if (needsProfileSetup) {
      const familyName = data.familyName?.trim()
      if (!familyName) {
        setError('Informe o nome da família.')
        return
      }

      // UUID gerado no cliente: evita que o RETURNING do INSERT seja bloqueado
      // pelo RLS (auth_tenant_id() ainda é NULL antes do profile ser atualizado).
      const newTenantId = crypto.randomUUID()
      const { error: tenantError } = await supabase
        .from('tenants')
        .insert({ id: newTenantId, name: familyName })
      if (tenantError) { setError('Erro ao criar família.'); return }

      tenantId = newTenantId
      const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? 'Usuário'

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user!.id,
        tenant_id: tenantId,
        full_name: displayName,
        role: 'partner',
      })
      if (profileError) { setError('Erro ao configurar perfil.'); return }
      await refreshProfile()
    }

    if (!tenantId) { setError('Perfil não encontrado. Recarregue e tente novamente.'); return }

    const due = addDays(new Date(data.lmpDate), 280)
    const { error: pregError } = await supabase.from('pregnancies').insert({
      tenant_id: tenantId,
      baby_name: data.babyName,
      baby_sex: data.babySex,
      lmp_date: data.lmpDate,
      due_date: format(due, 'yyyy-MM-dd'),
      status: 'active',
    })
    if (pregError) { setError('Erro ao salvar gestação.'); return }

    navigate(ROUTES.DASHBOARD)
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5"
      style={{ background: 'linear-gradient(135deg, #f0fdfa, #fce7f3)' }}>
      <div className="w-100 px-3" style={{ maxWidth: 480 }}>

        <div className="text-center mb-4">
          <div className="d-inline-flex mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 108" width="64" height="64" aria-hidden="true">
              <circle cx="27" cy="13" r="8" fill="#4FB6AC"/>
              <path d="M27 21 C13 30 11 52 27 62 C34 67 42 70 48 73" stroke="#4FB6AC" strokeWidth="13" strokeLinecap="round" fill="none"/>
              <circle cx="73" cy="13" r="8" fill="#F28C82"/>
              <path d="M73 21 C87 30 89 52 73 62 C66 67 58 70 52 73" stroke="#F28C82" strokeWidth="13" strokeLinecap="round" fill="none"/>
              <circle cx="50" cy="37" r="5.5" fill="#4FB6AC"/>
              <path d="M50 43 C50 52 50 59 50 64" stroke="#4FB6AC" strokeWidth="9" strokeLinecap="round" fill="none"/>
              <path d="M10 85 C22 77 33 89 50 83 C67 77 78 89 90 83" stroke="#4FB6AC" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <h2 className="fw-bold">Configure sua gestação</h2>
          <p className="text-muted small mb-0">Vamos personalizar sua jornada</p>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)}>

              {/* Family name — only for Google OAuth new users */}
              {needsProfileSetup && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Nome da família
                    <span className="text-muted fw-normal small ms-1">como vocês querem ser chamados?</span>
                  </label>
                  <input
                    {...register('familyName')}
                    className={`form-control ${errors.familyName ? 'is-invalid' : ''}`}
                    placeholder="Ex: Família Silva, Casa dos Serafim..."
                  />
                  {errors.familyName && <div className="invalid-feedback">{errors.familyName.message}</div>}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Nome carinhoso do bebê
                </label>
                <input
                  {...register('babyName')}
                  className={`form-control ${errors.babyName ? 'is-invalid' : ''}`}
                  placeholder="Ex: Bebê, Aurora, Miguelzinho..."
                />
                {errors.babyName && <div className="invalid-feedback">{errors.babyName.message}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Sexo do bebê</label>
                <div className="d-flex gap-2">
                  {SEX_OPTIONS.map(opt => {
                    const selected = babySex === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue('babySex', opt.value, { shouldValidate: true })}
                        className="flex-fill border-0 rounded-3 py-3 px-2 d-flex flex-column align-items-center"
                        style={{
                          cursor: 'pointer',
                          outline: selected ? '2px solid #7c3aed' : '2px solid #e2e8f0',
                          background: selected ? '#ede9fe' : '#f8fafc',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{opt.emoji}</span>
                        <span className="small fw-semibold mt-1" style={{ color: selected ? '#7c3aed' : '#64748b' }}>
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <input type="hidden" {...register('babySex')} />
                {errors.babySex && <div className="text-danger small mt-1">{errors.babySex.message}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Data da última menstruação (DUM)
                </label>
                <input
                  {...register('lmpDate')}
                  type="date"
                  className={`form-control ${errors.lmpDate ? 'is-invalid' : ''}`}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.lmpDate && <div className="invalid-feedback">{errors.lmpDate.message}</div>}
                {dueDate && (
                  <div className="mt-2 p-2 rounded-3 text-center small"
                    style={{ background: '#ede9fe', color: '#7c3aed' }}>
                    🍼 Data provável do parto: <strong>{dueDate}</strong>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn w-100 text-white fw-semibold"
                style={{ background: '#0D9488', borderRadius: 14 }}
                disabled={isSubmitting}
              >
                {isSubmitting && <span className="spinner-border spinner-border-sm me-2" />}
                Começar minha jornada 🌟
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
