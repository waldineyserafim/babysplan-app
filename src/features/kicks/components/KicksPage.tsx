import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useKicks, DAILY_GOAL } from '../hooks/useKicks'

export function KicksPage() {
  const { count, goalReached, history, isLoading, tap } = useKicks()
  const sessionStart = format(new Date(), 'HH:mm')

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" style={{ color: '#7c3aed' }} />
      </div>
    )
  }

  return (
    <div>
      <h4 className="fw-bold mb-4">Contador de Chutes</h4>

      <div
        className="card border-0 shadow-sm mb-4 p-4 text-center"
        style={{ background: 'linear-gradient(135deg, #fce7f3, #ede9fe)' }}
      >
        <div className="text-muted small mb-2">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </div>

        <div
          className="mx-auto d-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{
            width: 160, height: 160,
            background: goalReached
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : 'linear-gradient(135deg, #7c3aed, #db2777)',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
            transition: 'transform 0.1s',
          }}
          onClick={() => tap.mutate(count + 1)}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div className="text-white text-center">
            <div style={{ fontSize: '3rem', lineHeight: 1, fontWeight: 'bold' }}>{count}</div>
            <div style={{ fontSize: '0.875rem' }}>chutes</div>
          </div>
        </div>

        <div className="mb-3">
          {goalReached ? (
            <span className="badge bg-success fs-6">Meta atingida! ({DAILY_GOAL} chutes)</span>
          ) : (
            <span className="text-muted small">Meta: {DAILY_GOAL} chutes · Faltam {DAILY_GOAL - count}</span>
          )}
        </div>

        <div className="d-flex gap-2 justify-content-center">
          <button
            className="btn btn-lg text-white fw-bold px-5"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', borderRadius: 12 }}
            onClick={() => tap.mutate(count + 1)}
            disabled={tap.isPending}
          >
            REGISTRAR
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => tap.mutate(0)}
            disabled={tap.isPending || count === 0}
          >
            Zerar
          </button>
        </div>

        <div className="text-muted small mt-3">
          Sessão iniciada às {sessionStart}
        </div>
      </div>

      {history.length > 0 && (
        <div className="card border-0 shadow-sm p-4">
          <h6 className="fw-bold mb-3">Histórico 7 dias</h6>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={history}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="chutes" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
