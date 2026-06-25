import { Outlet } from 'react-router-dom'
import { BrandSymbol } from '@/shared/components/BrandLogo'

export function AuthLayout() {
  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center py-5"
      style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #fce7f3 100%)' }}
    >
      <div className="w-100" style={{ maxWidth: 440 }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex mb-3">
            <BrandSymbol size={64} />
          </div>
          <h1 className="fw-bold mb-1" style={{ fontFamily: "'Manrope', 'Inter', system-ui" }}>
            <span style={{ color: '#4FB6AC' }}>Baby's</span>{' '}
            <span style={{ color: '#F28C82' }}>Plan</span>
          </h1>
          <p className="text-muted small">Organizando cada etapa da sua jornada.</p>
        </div>
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
