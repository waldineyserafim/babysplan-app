import { useState } from 'react'
import { Plus, Edit2, Trash2, ShoppingBag, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLayette } from '../hooks/useLayette'
import {
  STATUS_CONFIG,
  CATEGORY_LABELS,
} from '../services/layetteService'
import type { LayetteCatalog, LayetteItemWithCatalog } from '../services/layetteService'

// ─── Add modal schema ────────────────────────────────────────────────────────
const addSchema = z.object({
  catalog_id: z.string().min(1, 'Selecione um item'),
  status: z.string().default('planned'),
  quantity_ideal: z.union([z.literal(''), z.coerce.number().int().min(1)]).optional(),
  planned_value: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
  store_name: z.string().optional(),
  notes: z.string().optional(),
})

const editSchema = z.object({
  status: z.string(),
  quantity_purchased: z.union([z.literal(''), z.coerce.number().int().min(0)]).optional(),
  quantity_received: z.union([z.literal(''), z.coerce.number().int().min(0)]).optional(),
  paid_value: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
  store_name: z.string().optional(),
  purchase_date: z.string().optional(),
  notes: z.string().optional(),
})

type AddValues = z.infer<typeof addSchema>
type EditValues = z.infer<typeof editSchema>

function categoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1)
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.planned
  return (
    <span
      className="badge"
      style={{ background: cfg.bg, color: cfg.color, fontSize: '0.7rem' }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Add Item Modal ──────────────────────────────────────────────────────────
function AddItemModal({
  catalog,
  existingIds,
  activeCategory,
  onSubmit,
  onClose,
  loading,
}: {
  catalog: LayetteCatalog[]
  existingIds: Set<string>
  activeCategory: string
  onSubmit: (v: AddValues) => Promise<void>
  onClose: () => void
  loading: boolean
}) {
  const available = catalog.filter(
    c => !existingIds.has(c.id) && (activeCategory === '__all' || c.category === activeCategory)
  )

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { status: 'planned', quantity_ideal: '', planned_value: '', store_name: '', notes: '' },
  })

  const selectedId = watch('catalog_id')
  const selectedItem = catalog.find(c => c.id === selectedId)

  return (
    <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Adicionar ao Enxoval</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              {available.length === 0 ? (
                <p className="text-muted text-center py-3">
                  Todos os itens desta categoria já foram adicionados.
                </p>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Item do catálogo *</label>
                    <select
                      {...register('catalog_id')}
                      className={`form-select ${errors.catalog_id ? 'is-invalid' : ''}`}
                    >
                      <option value="">Selecione um item...</option>
                      {available.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.item_name} {c.criticality === 'essencial' ? '★' : ''}
                        </option>
                      ))}
                    </select>
                    {errors.catalog_id && <div className="invalid-feedback">{errors.catalog_id.message}</div>}
                    {selectedItem && (
                      <div className="mt-2 p-2 rounded" style={{ background: '#f8fafc', fontSize: '0.8rem', color: '#64748b' }}>
                        {selectedItem.description && <div>{selectedItem.description}</div>}
                        {selectedItem.ideal_quantity && <div>Qtd. sugerida: <strong>{selectedItem.ideal_quantity}</strong></div>}
                        {(selectedItem.price_brl_min || selectedItem.price_brl_max) && (
                          <div>
                            Faixa de preço: R$ {selectedItem.price_brl_min}–{selectedItem.price_brl_max}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Qtd. ideal</label>
                      <input {...register('quantity_ideal')} type="number" min={1} className="form-control" placeholder={String(selectedItem?.ideal_quantity ?? '')} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Valor planejado (R$)</label>
                      <input {...register('planned_value')} type="number" step="0.01" min={0} className="form-control" placeholder="0,00" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Status</label>
                    <select {...register('status')} className="form-select">
                      <option value="planned">Planejado</option>
                      <option value="purchased">Comprado</option>
                      <option value="received">Recebido</option>
                      <option value="gifted">Presenteado</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Loja / Fornecedor</label>
                    <input {...register('store_name')} className="form-control" placeholder="Ex: Amazon, Ri Happy..." />
                  </div>

                  <div>
                    <label className="form-label fw-semibold small">Observações</label>
                    <input {...register('notes')} className="form-control" placeholder="Cor, tamanho, variante..." />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancelar</button>
              {available.length > 0 && (
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading && <span className="spinner-border spinner-border-sm me-2" />}
                  Adicionar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Item Modal ─────────────────────────────────────────────────────────
function EditItemModal({
  item,
  onSubmit,
  onClose,
  loading,
}: {
  item: LayetteItemWithCatalog
  onSubmit: (v: EditValues) => Promise<void>
  onClose: () => void
  loading: boolean
}) {
  const { register, handleSubmit } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      status: item.status ?? 'planned',
      quantity_purchased: item.quantity_purchased ?? '',
      quantity_received: item.quantity_received ?? '',
      paid_value: item.paid_value ?? '',
      store_name: item.store_name ?? '',
      purchase_date: item.purchase_date ?? '',
      notes: item.notes ?? '',
    },
  })

  return (
    <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">{item.catalog.item_name}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold small">Status</label>
                <select {...register('status')} className="form-select">
                  <option value="planned">Planejado</option>
                  <option value="purchased">Comprado</option>
                  <option value="received">Recebido</option>
                  <option value="gifted">Presenteado</option>
                </select>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label fw-semibold small">Qtd. comprada</label>
                  <input {...register('quantity_purchased')} type="number" min={0} className="form-control" />
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold small">Qtd. recebida</label>
                  <input {...register('quantity_received')} type="number" min={0} className="form-control" />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label fw-semibold small">Valor pago (R$)</label>
                  <input {...register('paid_value')} type="number" step="0.01" min={0} className="form-control" />
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold small">Data da compra</label>
                  <input {...register('purchase_date')} type="date" className="form-control" />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">Loja</label>
                <input {...register('store_name')} className="form-control" />
              </div>

              <div>
                <label className="form-label fw-semibold small">Observações</label>
                <input {...register('notes')} className="form-control" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function LayettePage() {
  const { catalog, items, isLoading, add, update, remove } = useLayette()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<LayetteItemWithCatalog | null>(null)
  const [activeCategory, setActiveCategory] = useState('__all')

  const categories = Array.from(new Set(catalog.map(c => c.category))).sort()
  const existingCatalogIds = new Set(items.map(i => i.catalog_id))

  const filtered = activeCategory === '__all'
    ? items
    : items.filter(i => i.catalog.category === activeCategory)

  const acquired = items.filter(i => i.status === 'purchased' || i.status === 'received' || i.status === 'gifted')
  const totalSpent = items.reduce((sum, i) => sum + (i.paid_value ?? 0), 0)

  async function handleAdd(values: AddValues) {
    await add.mutateAsync({
      catalog_id: values.catalog_id,
      status: values.status || 'planned',
      quantity_ideal: values.quantity_ideal === '' ? null : Number(values.quantity_ideal),
      planned_value: values.planned_value === '' ? null : Number(values.planned_value),
      store_name: values.store_name || null,
      notes: values.notes || null,
    })
    setShowAdd(false)
  }

  async function handleEdit(values: EditValues) {
    if (!editing) return
    await update.mutateAsync({
      id: editing.id,
      fields: {
        status: values.status,
        quantity_purchased: values.quantity_purchased === '' ? null : Number(values.quantity_purchased),
        quantity_received: values.quantity_received === '' ? null : Number(values.quantity_received),
        paid_value: values.paid_value === '' ? null : Number(values.paid_value),
        store_name: values.store_name || null,
        purchase_date: values.purchase_date || null,
        notes: values.notes || null,
      },
    })
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este item do enxoval?')) return
    await remove.mutateAsync(id)
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
          <h4 className="fw-bold mb-0">Enxoval do Bebê</h4>
          <p className="text-muted small mb-0">{items.length} item(s) · {acquired.length} adquirido(s)</p>
        </div>
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={() => setShowAdd(true)}>
          <Plus size={16} />
          Adicionar item
        </button>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-4">
            <div className="card border-0 shadow-sm p-3 text-center">
              <div className="fw-bold fs-5" style={{ color: '#7c3aed' }}>{items.length}</div>
              <div className="text-muted small">Total</div>
            </div>
          </div>
          <div className="col-4">
            <div className="card border-0 shadow-sm p-3 text-center">
              <div className="fw-bold fs-5 text-success">{acquired.length}</div>
              <div className="text-muted small">Adquiridos</div>
            </div>
          </div>
          <div className="col-4">
            <div className="card border-0 shadow-sm p-3 text-center">
              <div className="fw-bold fs-5 text-primary">
                {totalSpent > 0 ? `R$ ${totalSpent.toFixed(0)}` : '—'}
              </div>
              <div className="text-muted small">Gasto total</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      {items.length > 0 && (
        <div className="mb-4">
          <div className="progress" style={{ height: 8 }}>
            <div
              className="progress-bar"
              style={{
                width: `${Math.round((acquired.length / items.length) * 100)}%`,
                background: 'linear-gradient(135deg, #7c3aed, #22c55e)',
              }}
            />
          </div>
          <div className="d-flex justify-content-between mt-1">
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{acquired.length} adquirido(s)</span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{items.length - acquired.length} pendente(s)</span>
          </div>
        </div>
      )}

      {/* Category tabs */}
      {catalog.length > 0 && (
        <ul className="nav nav-pills mb-4 gap-1 flex-wrap">
          <li className="nav-item">
            <button
              className={`nav-link btn btn-sm ${activeCategory === '__all' ? 'active' : 'text-secondary'}`}
              onClick={() => setActiveCategory('__all')}
              style={{ fontSize: '0.8rem' }}
            >
              Todos ({items.length})
            </button>
          </li>
          {categories.map(cat => {
            const count = items.filter(i => i.catalog.category === cat).length
            return (
              <li key={cat} className="nav-item">
                <button
                  className={`nav-link btn btn-sm ${activeCategory === cat ? 'active' : 'text-secondary'}`}
                  onClick={() => setActiveCategory(cat)}
                  style={{ fontSize: '0.8rem' }}
                >
                  {categoryLabel(cat)} ({count})
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="card border-0 shadow-sm p-5 text-center text-muted">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-50" />
          <p className="fw-semibold mb-1">Enxoval vazio</p>
          <p className="small mb-3">
            {catalog.length === 0
              ? 'O catálogo de itens ainda não foi preenchido pelo administrador.'
              : 'Adicione itens do catálogo para montar o enxoval do seu bebê.'}
          </p>
          {catalog.length > 0 && (
            <button
              className="btn btn-primary btn-sm mx-auto"
              style={{ width: 'fit-content' }}
              onClick={() => setShowAdd(true)}
            >
              <Plus size={14} className="me-1" />
              Primeiro item
            </button>
          )}
        </div>
      )}

      {/* Items list */}
      <div className="d-flex flex-column gap-2">
        {filtered.map(item => {
          const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.planned
          return (
            <div key={item.id} className="card border-0 shadow-sm p-3">
              <div className="d-flex align-items-start justify-content-between gap-2">
                <div className="d-flex align-items-start gap-3 flex-grow-1 min-w-0">
                  <div
                    className="rounded d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                    style={{ width: 36, height: 36, background: cfg.bg }}
                  >
                    <Package size={16} style={{ color: cfg.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="fw-semibold text-truncate">{item.catalog.item_name}</div>
                    <div className="d-flex flex-wrap align-items-center gap-2 mt-1">
                      <StatusBadge status={item.status ?? 'planned'} />
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {categoryLabel(item.catalog.category)}
                      </span>
                      {item.quantity_ideal && (
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Qtd: {item.quantity_purchased ?? 0}/{item.quantity_ideal}
                        </span>
                      )}
                      {item.paid_value && (
                        <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>
                          R$ {item.paid_value.toFixed(2)}
                        </span>
                      )}
                      {item.store_name && (
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {item.store_name}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="small text-muted mb-0 mt-1">{item.notes}</p>
                    )}
                  </div>
                </div>
                <div className="d-flex gap-1 flex-shrink-0">
                  <button className="btn btn-sm btn-light p-1" onClick={() => setEditing(item)} title="Editar">
                    <Edit2 size={13} />
                  </button>
                  <button className="btn btn-sm btn-light p-1 text-danger" onClick={() => handleDelete(item.id)} title="Remover">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showAdd && (
        <AddItemModal
          catalog={catalog}
          existingIds={existingCatalogIds}
          activeCategory={activeCategory}
          onSubmit={handleAdd}
          onClose={() => setShowAdd(false)}
          loading={add.isPending}
        />
      )}

      {editing && (
        <EditItemModal
          item={editing}
          onSubmit={handleEdit}
          onClose={() => setEditing(null)}
          loading={update.isPending}
        />
      )}
    </div>
  )
}
