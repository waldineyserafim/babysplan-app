import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, FileText } from 'lucide-react'
import { useBirthPlan } from '../hooks/useBirthPlan'
import {
  ANALGESIA_OPTIONS,
  PAIN_MANAGEMENT_OPTIONS,
  BIRTH_POSITION_OPTIONS,
  CORD_OPTIONS,
} from '../services/birthPlanService'

const schema = z.object({
  hospital_name: z.string().optional(),
  doctor_name: z.string().optional(),
  companion_name: z.string().optional(),
  analgesia_preference: z.string().optional(),
  pain_management_options: z.array(z.string()).optional(),
  birth_position_preferences: z.array(z.string()).optional(),
  skin_to_skin: z.boolean().optional(),
  cord_cutting_preference: z.string().optional(),
  breastfeeding_intention: z.boolean().optional(),
  music_preferences: z.string().optional(),
  additional_notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card border-0 shadow-sm p-4 mb-4">
      <h6 className="fw-bold mb-3" style={{ color: '#7c3aed' }}>{title}</h6>
      {children}
    </div>
  )
}

function CheckGroup({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter(x => x !== opt) : [...value, opt])
  }
  return (
    <div className="d-flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          className="btn btn-sm"
          style={{
            background: value.includes(opt) ? '#ede9fe' : '#f8fafc',
            color: value.includes(opt) ? '#7c3aed' : '#64748b',
            border: `1px solid ${value.includes(opt) ? '#7c3aed' : '#e2e8f0'}`,
            borderRadius: 20,
          }}
          onClick={() => toggle(opt)}
        >
          {value.includes(opt) && <CheckCircle size={12} className="me-1" />}
          {opt}
        </button>
      ))}
    </div>
  )
}

export function BirthPlanPage() {
  const { data: plan, isLoading, save } = useBirthPlan()
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pain_management_options: [],
      birth_position_preferences: [],
      skin_to_skin: true,
      breastfeeding_intention: true,
    },
  })

  const painOptions = watch('pain_management_options') ?? []
  const positionOptions = watch('birth_position_preferences') ?? []

  useEffect(() => {
    if (plan) {
      reset({
        hospital_name: plan.hospital_name ?? '',
        doctor_name: plan.doctor_name ?? '',
        companion_name: plan.companion_name ?? '',
        analgesia_preference: plan.analgesia_preference ?? '',
        pain_management_options: plan.pain_management_options ?? [],
        birth_position_preferences: plan.birth_position_preferences ?? [],
        skin_to_skin: plan.skin_to_skin ?? true,
        cord_cutting_preference: plan.cord_cutting_preference ?? '',
        breastfeeding_intention: plan.breastfeeding_intention ?? true,
        music_preferences: plan.music_preferences ?? '',
        additional_notes: plan.additional_notes ?? '',
      })
    }
  }, [plan, reset])

  async function onSubmit(values: FormValues) {
    await save.mutateAsync({
      hospital_name: values.hospital_name || null,
      doctor_name: values.doctor_name || null,
      companion_name: values.companion_name || null,
      analgesia_preference: values.analgesia_preference || null,
      pain_management_options: values.pain_management_options?.length ? values.pain_management_options : null,
      birth_position_preferences: values.birth_position_preferences?.length ? values.birth_position_preferences : null,
      skin_to_skin: values.skin_to_skin ?? null,
      cord_cutting_preference: values.cord_cutting_preference || null,
      breastfeeding_intention: values.breastfeeding_intention ?? null,
      music_preferences: values.music_preferences || null,
      additional_notes: values.additional_notes || null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" style={{ color: '#7c3aed' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 44, height: 44, background: '#ede9fe' }}
        >
          <FileText size={20} style={{ color: '#7c3aed' }} />
        </div>
        <div>
          <h4 className="fw-bold mb-0">Plano de Parto</h4>
          <p className="text-muted small mb-0">
            {plan ? 'Atualizado — salve para registrar alterações' : 'Preencha suas preferências para o parto'}
          </p>
        </div>
      </div>

      {saved && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2">
          <CheckCircle size={16} />
          Plano de parto salvo com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Section title="Local e Equipe">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold small">Maternidade / Hospital</label>
              <input {...register('hospital_name')} className="form-control" placeholder="Nome da maternidade" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small">Médico(a) / Obstetra</label>
              <input {...register('doctor_name')} className="form-control" placeholder="Nome do médico" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small">Acompanhante principal</label>
              <input {...register('companion_name')} className="form-control" placeholder="Nome do acompanhante" />
            </div>
          </div>
        </Section>

        <Section title="Analgesia e Alívio da Dor">
          <div className="mb-3">
            <label className="form-label fw-semibold small">Preferência de analgesia</label>
            <select {...register('analgesia_preference')} className="form-select">
              <option value="">Selecione...</option>
              {ANALGESIA_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label fw-semibold small d-block mb-2">Métodos de alívio desejados</label>
            <CheckGroup
              options={PAIN_MANAGEMENT_OPTIONS}
              value={painOptions}
              onChange={v => setValue('pain_management_options', v)}
            />
          </div>
        </Section>

        <Section title="Posições no Parto">
          <label className="form-label fw-semibold small d-block mb-2">Posições de preferência</label>
          <CheckGroup
            options={BIRTH_POSITION_OPTIONS}
            value={positionOptions}
            onChange={v => setValue('birth_position_preferences', v)}
          />
        </Section>

        <Section title="Pós-parto Imediato">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold small">Corte do cordão umbilical</label>
              <select {...register('cord_cutting_preference')} className="form-select">
                <option value="">Selecione...</option>
                {CORD_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 d-flex flex-column gap-3 pt-1">
              <div className="form-check form-switch mt-3">
                <input
                  {...register('skin_to_skin')}
                  type="checkbox"
                  className="form-check-input"
                  id="skin_to_skin"
                  role="switch"
                />
                <label className="form-check-label fw-semibold small" htmlFor="skin_to_skin">
                  Contato pele a pele imediato
                </label>
              </div>
              <div className="form-check form-switch">
                <input
                  {...register('breastfeeding_intention')}
                  type="checkbox"
                  className="form-check-input"
                  id="breastfeeding"
                  role="switch"
                />
                <label className="form-check-label fw-semibold small" htmlFor="breastfeeding">
                  Intenção de amamentar
                </label>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Preferências Adicionais">
          <div className="mb-3">
            <label className="form-label fw-semibold small">Preferências musicais</label>
            <input
              {...register('music_preferences')}
              className="form-control"
              placeholder="Ex: músicas calmas, playlist específica, silêncio..."
            />
          </div>
          <div>
            <label className="form-label fw-semibold small">Observações adicionais</label>
            <textarea
              {...register('additional_notes')}
              className="form-control"
              rows={4}
              placeholder="Outras preferências, pedidos especiais, informações importantes para a equipe médica..."
            />
          </div>
        </Section>

        <div className="d-flex justify-content-end">
          <button
            type="submit"
            className="btn btn-primary px-4"
            disabled={save.isPending}
          >
            {save.isPending && <span className="spinner-border spinner-border-sm me-2" />}
            {plan ? 'Atualizar Plano' : 'Salvar Plano'}
          </button>
        </div>
      </form>
    </div>
  )
}
