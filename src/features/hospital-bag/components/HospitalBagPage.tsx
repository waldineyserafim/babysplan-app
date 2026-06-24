import { useState } from 'react'
import { Plus, Trash2, Briefcase, Sparkles } from 'lucide-react'
import { useHospitalBag } from '../hooks/useHospitalBag'
import { PERSONS, SUGGESTED_ITEMS } from '../services/hospitalBagService'
import type { HospitalBagItem } from '../services/hospitalBagService'

type Person = typeof PERSONS[number]['value']

export function HospitalBagPage() {
  const { data: items, isLoading, create, bulkCreate, update, remove } = useHospitalBag()
  const [activeTab, setActiveTab] = useState<Person>('mae')
  const [addingItem, setAddingItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  const tabItems = items.filter(i => i.person === activeTab)
  const packed = tabItems.filter(i => i.status === 'packed')
  const progress = tabItems.length > 0 ? Math.round((packed.length / tabItems.length) * 100) : 0

  const totalItems = items.length
  const totalPacked = items.filter(i => i.status === 'packed').length

  async function handleToggle(item: HospitalBagItem) {
    await update.mutateAsync({
      id: item.id,
      fields: { status: item.status === 'packed' ? 'pending' : 'packed' },
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este item?')) return
    await remove.mutateAsync(id)
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItemName.trim()) return
    await create.mutateAsync({ item_name: newItemName.trim(), person: activeTab, status: 'pending' })
    setNewItemName('')
    setAddingItem(false)
  }

  async function handleAddSuggestions() {
    const suggestions = SUGGESTED_ITEMS[activeTab] ?? []
    const existingNames = new Set(tabItems.map(i => i.item_name))
    const toAdd = suggestions
      .filter(s => !existingNames.has(s))
      .map((item_name, i) => ({ item_name, person: activeTab, status: 'pending' as const, sort_order: i }))
    if (toAdd.length === 0) return
    await bulkCreate.mutateAsync(toAdd)
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
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-0">Mala da Maternidade</h4>
          <p className="text-muted small mb-0">{totalPacked}/{totalItems} itens prontos</p>
        </div>
      </div>

      {totalItems > 0 && (
        <div className="mb-4">
          <div className="d-flex justify-content-between mb-1">
            <span className="small text-muted">Progresso geral</span>
            <span className="small fw-semibold">{Math.round((totalPacked / totalItems) * 100)}%</span>
          </div>
          <div className="progress" style={{ height: 8 }}>
            <div
              className="progress-bar"
              style={{
                width: `${Math.round((totalPacked / totalItems) * 100)}%`,
                background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              }}
            />
          </div>
        </div>
      )}

      {/* Tabs por pessoa */}
      <ul className="nav nav-pills mb-4 gap-1 flex-wrap">
        {PERSONS.map(p => {
          const count = items.filter(i => i.person === p.value).length
          const packedCount = items.filter(i => i.person === p.value && i.status === 'packed').length
          return (
            <li key={p.value} className="nav-item">
              <button
                className={`nav-link btn btn-sm ${activeTab === p.value ? 'active' : 'text-secondary'}`}
                onClick={() => setActiveTab(p.value)}
                style={{ fontSize: '0.8rem' }}
              >
                {p.emoji} {p.label}
                {count > 0 && (
                  <span className={`badge ms-2 ${activeTab === p.value ? 'bg-white text-primary' : 'bg-light text-secondary'}`} style={{ fontSize: '0.65rem' }}>
                    {packedCount}/{count}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {/* Progress da tab atual */}
      {tabItems.length > 0 && (
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span className="small text-muted">{PERSONS.find(p => p.value === activeTab)?.label}</span>
            <span className="small fw-semibold">{packed.length}/{tabItems.length} ({progress}%)</span>
          </div>
          <div className="progress" style={{ height: 6 }}>
            <div
              className="progress-bar bg-success"
              style={{ width: `${progress}%`, transition: 'width 0.3s' }}
            />
          </div>
        </div>
      )}

      {/* Lista de itens */}
      <div className="card border-0 shadow-sm mb-3">
        {tabItems.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <Briefcase size={36} className="mx-auto mb-3 opacity-50" />
            <p className="fw-semibold mb-1">Nenhum item adicionado</p>
            <p className="small mb-0">Adicione itens manualmente ou use as sugestões abaixo.</p>
          </div>
        ) : (
          <ul className="list-group list-group-flush">
            {tabItems.map(item => (
              <li key={item.id} className="list-group-item d-flex align-items-center gap-3 py-2">
                <input
                  type="checkbox"
                  className="form-check-input flex-shrink-0"
                  checked={item.status === 'packed'}
                  onChange={() => handleToggle(item)}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#7c3aed' }}
                />
                <span
                  className="flex-grow-1"
                  style={{
                    textDecoration: item.status === 'packed' ? 'line-through' : 'none',
                    color: item.status === 'packed' ? '#94a3b8' : 'inherit',
                    fontSize: '0.9rem',
                  }}
                >
                  {item.item_name}
                </span>
                <button
                  className="btn btn-sm btn-light p-1 text-danger flex-shrink-0"
                  onClick={() => handleDelete(item.id)}
                  title="Remover"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Adicionar item */}
      {addingItem ? (
        <form onSubmit={handleAddItem} className="d-flex gap-2 mb-3">
          <input
            autoFocus
            className="form-control"
            placeholder="Nome do item..."
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm px-3" disabled={create.isPending}>
            Adicionar
          </button>
          <button type="button" className="btn btn-light btn-sm" onClick={() => { setAddingItem(false); setNewItemName('') }}>
            Cancelar
          </button>
        </form>
      ) : (
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-2"
            onClick={() => setAddingItem(true)}
          >
            <Plus size={15} />
            Adicionar item
          </button>
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
            onClick={handleAddSuggestions}
            disabled={bulkCreate.isPending}
          >
            {bulkCreate.isPending
              ? <span className="spinner-border spinner-border-sm" />
              : <Sparkles size={15} />
            }
            Sugestões para {PERSONS.find(p => p.value === activeTab)?.label}
          </button>
        </div>
      )}
    </div>
  )
}
