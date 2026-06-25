import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center py-5"
      style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #fce7f3 100%)' }}
    >
      <div className="w-100" style={{ maxWidth: 440 }}>
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
