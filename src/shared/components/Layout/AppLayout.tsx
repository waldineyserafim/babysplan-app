import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import { ROUTES } from '@/shared/constants/routes'
import {
  Baby,
  LayoutDashboard,
  Calendar,
  FlaskConical,
  Syringe,
  Activity,
  Camera,
  BookOpen,
  Baby as KickIcon,
  Timer,
  ShoppingCart,
  Globe,
  Stethoscope,
  FileText,
  FolderOpen,
  LogOut,
  Bell,
  Sparkles,
  BarChart3,
  ShieldAlert,
  MoreHorizontal,
  X,
  Settings,
  UserPlus,
} from 'lucide-react'
import { useState } from 'react'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'
import { useInstallPrompt } from '@/shared/hooks/useInstallPrompt'
import { useCurrentPregnancy } from '@/shared/hooks/useCurrentPregnancy'
import { useRealtimeSync } from '@/shared/hooks/useRealtimeSync'

// All navigation items
const allNavItems = [
  { to: ROUTES.DASHBOARD,           icon: LayoutDashboard, label: 'Dashboard',    group: 'main' },
  { to: ROUTES.BABY_DEVELOPMENT,    icon: Baby,            label: 'Bebê',          group: 'main' },
  { to: ROUTES.TIMELINE,            icon: Activity,        label: 'Timeline',      group: 'main' },
  { to: ROUTES.APPOINTMENTS,        icon: Calendar,        label: 'Consultas',     group: 'saude' },
  { to: ROUTES.EXAMS,               icon: FlaskConical,    label: 'Exames',        group: 'saude' },
  { to: ROUTES.VACCINES,            icon: Syringe,         label: 'Vacinas',       group: 'saude' },
  { to: ROUTES.SYMPTOMS,            icon: Stethoscope,     label: 'Sintomas',      group: 'saude' },
  { to: ROUTES.KICKS,               icon: KickIcon,        label: 'Chutes',        group: 'saude' },
  { to: ROUTES.CONTRACTIONS,        icon: Timer,           label: 'Contrações',    group: 'saude' },
  { to: ROUTES.DIARY,               icon: BookOpen,        label: 'Diário',        group: 'memoria' },
  { to: ROUTES.PHOTOS,              icon: Camera,          label: 'Fotos',         group: 'memoria' },
  { to: ROUTES.DOCUMENTS,           icon: FolderOpen,      label: 'Documentos',    group: 'memoria' },
  { to: ROUTES.LAYETTE,             icon: ShoppingCart,    label: 'Enxoval',       group: 'prep' },
  { to: ROUTES.HOSPITAL_BAG,        icon: FileText,        label: 'Mala',          group: 'prep' },
  { to: ROUTES.LAYETTE_INTELLIGENCE,icon: Sparkles,        label: 'Inteligência',  group: 'prep' },
  { to: ROUTES.INTERNATIONAL_MOVE,  icon: Globe,           label: 'Mudança',       group: 'prep' },
  { to: ROUTES.NOTIFICATIONS,       icon: Bell,            label: 'Notificações',  group: 'system' },
  { to: ROUTES.REPORTS,             icon: BarChart3,       label: 'Relatórios',    group: 'system' },
  { to: ROUTES.SETTINGS,            icon: Settings,        label: 'Configurações', group: 'system' },
  { to: ROUTES.ADMIN,               icon: ShieldAlert,     label: 'Admin',         group: 'system' },
]

// Bottom nav — 4 primary tabs + "Mais"
const bottomNavItems = [
  { to: ROUTES.DASHBOARD,        icon: LayoutDashboard, label: 'Início' },
  { to: ROUTES.APPOINTMENTS,     icon: Calendar,        label: 'Consultas' },
  { to: ROUTES.DIARY,            icon: BookOpen,        label: 'Diário' },
  { to: ROUTES.PHOTOS,           icon: Camera,          label: 'Fotos' },
]

const GROUP_LABELS: Record<string, string> = {
  main:   'Acompanhamento',
  saude:  'Saúde',
  memoria:'Memórias',
  prep:   'Preparação',
  system: 'Geral',
}

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: unreadCount = 0 } = useUnreadCount()
  const { canInstall, install } = useInstallPrompt()
  const { data: pregnancy } = useCurrentPregnancy()
  useRealtimeSync(pregnancy?.id)

  async function handleSignOut() {
    await signOut()
    navigate(ROUTES.LOGIN)
    setMenuOpen(false)
  }

  const groups = Object.entries(
    allNavItems.reduce<Record<string, typeof allNavItems>>((acc, item) => {
      acc[item.group] = [...(acc[item.group] ?? []), item]
      return acc
    }, {})
  )

  const isBottomActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <nav
        className="d-none d-md-flex flex-column bg-white border-end position-fixed top-0 start-0 h-100"
        style={{ width: 240, zIndex: 1045, overflowY: 'auto' }}
      >
        {/* Logo */}
        <div className="px-3 py-4 border-bottom flex-shrink-0">
          <div className="d-flex align-items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 108" width="34" height="34" aria-hidden="true" style={{ flexShrink: 0 }}>
              <circle cx="27" cy="13" r="8" fill="#4FB6AC"/>
              <path d="M27 21 C13 30 11 52 27 62 C34 67 42 70 48 73" stroke="#4FB6AC" strokeWidth="13" strokeLinecap="round" fill="none"/>
              <circle cx="73" cy="13" r="8" fill="#F28C82"/>
              <path d="M73 21 C87 30 89 52 73 62 C66 67 58 70 52 73" stroke="#F28C82" strokeWidth="13" strokeLinecap="round" fill="none"/>
              <circle cx="50" cy="37" r="5.5" fill="#4FB6AC"/>
              <path d="M50 43 C50 52 50 59 50 64" stroke="#4FB6AC" strokeWidth="9" strokeLinecap="round" fill="none"/>
              <path d="M10 85 C22 77 33 89 50 83 C67 77 78 89 90 83" stroke="#4FB6AC" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="fw-bold fs-6">
              <span style={{ color: '#4FB6AC' }}>Baby's</span>{' '}
              <span style={{ color: '#F28C82' }}>Plan</span>
            </span>
          </div>
        </div>

        {/* Nav items */}
        <ul className="nav flex-column px-2 py-3 flex-grow-1">
          {allNavItems.map(({ to, icon: Icon, label }) => (
            <li key={to} className="nav-item mb-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 rounded px-3 py-2 ${isActive ? 'active text-white' : 'text-secondary'}`
                }
                style={({ isActive }) => ({
                  fontSize: '0.875rem',
                  background: isActive ? '#0D9488' : undefined,
                })}
              >
                <Icon size={16} />
                {label}
                {label === 'Notificações' && unreadCount > 0 && (
                  <span className="badge bg-danger ms-auto" style={{ fontSize: '0.6rem' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* PWA install */}
        {canInstall && (
          <div className="mx-2 mb-2 p-3 rounded-3 text-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #ede9fe, #fce7f3)' }}>
            <div className="fw-semibold small mb-1" style={{ color: '#7c3aed' }}>Instalar no celular</div>
            <button
              className="btn btn-sm text-white w-100"
              style={{ background: '#0D9488', fontSize: '0.75rem', borderRadius: 10 }}
              onClick={install}
            >
              📲 Instalar Baby's Plan
            </button>
          </div>
        )}

        {/* User footer */}
        <div className="px-3 py-3 border-top flex-shrink-0">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
              style={{ width: 32, height: 32, fontSize: '0.75rem', background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
            >
              {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="flex-grow-1 overflow-hidden">
              <div className="text-truncate fw-semibold" style={{ fontSize: '0.8rem' }}>
                {profile?.full_name ?? 'Usuário'}
              </div>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                {profile?.role === 'platform_admin' ? 'Admin' : profile?.role === 'partner' ? 'Casal' : 'Familiar'}
              </div>
            </div>
            <button className="btn btn-sm text-muted p-1" onClick={handleSignOut} title="Sair">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE TOPBAR ── */}
      <header
        className="d-md-none bg-white border-bottom d-flex align-items-center justify-content-between sticky-top px-4"
        style={{ height: 56, zIndex: 1030 }}
      >
        <div className="d-flex align-items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 108" width="28" height="28" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="27" cy="13" r="8" fill="#F28C82"/>
            <path d="M27 21 C13 30 11 52 27 62 C34 67 42 70 48 73" stroke="#F28C82" strokeWidth="13" strokeLinecap="round" fill="none"/>
            <circle cx="73" cy="13" r="8" fill="#4FB6AC"/>
            <path d="M73 21 C87 30 89 52 73 62 C66 67 58 70 52 73" stroke="#4FB6AC" strokeWidth="13" strokeLinecap="round" fill="none"/>
            <circle cx="50" cy="37" r="5.5" fill="#4FB6AC"/>
            <path d="M50 43 C50 52 50 59 50 64" stroke="#4FB6AC" strokeWidth="9" strokeLinecap="round" fill="none"/>
            <path d="M10 85 C22 77 33 89 50 83 C67 77 78 89 90 83" stroke="#4FB6AC" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
          </svg>
          <span className="fw-bold" style={{ fontSize: '1rem' }}>
            <span style={{ color: '#4FB6AC' }}>Baby's</span>{' '}
            <span style={{ color: '#F28C82' }}>Plan</span>
          </span>
        </div>
        <NavLink
          to={ROUTES.NOTIFICATIONS}
          className="d-flex align-items-center justify-content-center position-relative"
          style={{ width: 40, height: 40, color: '#64748b' }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              className="position-absolute badge rounded-pill bg-danger"
              style={{ top: 2, right: 2, fontSize: '0.5rem', padding: '2px 4px', minWidth: 14 }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>
      </header>

      {/* ── MAIN CONTENT (single Outlet) ── */}
      <main
        className="p-3 p-md-4"
        style={{
          marginLeft: 0,
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
        }}
      >
        {/* Desktop: offset for sidebar */}
        <div className="d-none d-md-block" style={{ marginLeft: 240 }}>
          <Outlet />
        </div>
        {/* Mobile: no offset */}
        <div className="d-md-none">
          <Outlet />
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="d-md-none bg-white border-top position-fixed bottom-0 start-0 end-0 d-flex"
        style={{ height: 64, zIndex: 1030, paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {bottomNavItems.map(({ to, icon: Icon, label }) => {
          const active = isBottomActive(to)
          return (
            <NavLink
              key={to}
              to={to}
              className="flex-grow-1 d-flex flex-column align-items-center justify-content-center gap-1 text-decoration-none"
              style={{ color: active ? '#7c3aed' : '#94a3b8', minWidth: 0 }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: '0.62rem', fontWeight: active ? 700 : 400, lineHeight: 1 }}>
                {label}
              </span>
            </NavLink>
          )
        })}

        {/* Mais button */}
        <button
          className="flex-grow-1 d-flex flex-column align-items-center justify-content-center gap-1 border-0 bg-transparent"
          style={{ color: menuOpen ? '#7c3aed' : '#94a3b8', minWidth: 0 }}
          onClick={() => setMenuOpen(true)}
        >
          <MoreHorizontal size={22} strokeWidth={menuOpen ? 2.5 : 1.8} />
          <span style={{ fontSize: '0.62rem', fontWeight: menuOpen ? 700 : 400, lineHeight: 1 }}>Mais</span>
        </button>
      </nav>

      {/* ── MOBILE FULL-SCREEN MENU OVERLAY ── */}
      {menuOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 end-0 bottom-0 bg-white"
          style={{ zIndex: 1050, overflowY: 'auto' }}
        >
          {/* Menu header */}
          <div
            className="d-flex align-items-center justify-content-between px-4 border-bottom sticky-top bg-white"
            style={{ height: 56 }}
          >
            <span className="fw-bold" style={{ color: '#7c3aed' }}>Menu</span>
            <button
              className="btn p-1"
              style={{ color: '#64748b' }}
              onClick={() => setMenuOpen(false)}
            >
              <X size={22} />
            </button>
          </div>

          {/* Nav groups */}
          <div className="px-3 py-2 pb-4">
            {groups.map(([group, items]) => (
              <div key={group} className="mb-3">
                <div
                  className="px-2 py-2 mb-1 fw-semibold"
                  style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                >
                  {GROUP_LABELS[group] ?? group}
                </div>
                {items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className="d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none mb-1"
                    style={({ isActive }) => ({
                      background: isActive ? 'linear-gradient(135deg, #ede9fe, #fce7f3)' : undefined,
                      color: isActive ? '#7c3aed' : '#374151',
                    })}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon size={20} />
                    <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{label}</span>
                    {label === 'Notificações' && unreadCount > 0 && (
                      <span className="badge bg-danger ms-auto" style={{ fontSize: '0.65rem' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}

            {/* Convidar parceiro(a) shortcut */}
            <NavLink
              to={ROUTES.SETTINGS}
              className="d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none mb-3 mt-1"
              style={{ background: 'linear-gradient(135deg, #ede9fe, #fce7f3)', color: '#7c3aed' }}
              onClick={() => setMenuOpen(false)}
            >
              <UserPlus size={20} />
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Convidar parceiro(a)</span>
            </NavLink>

            {/* PWA install in menu */}
            {canInstall && (
              <button
                className="btn w-100 text-white mt-2 py-3"
                style={{ background: '#0D9488', borderRadius: 12 }}
                onClick={() => { install(); setMenuOpen(false) }}
              >
                📲 Instalar Baby's Plan no celular
              </button>
            )}

            {/* User + logout */}
            <div className="d-flex align-items-center gap-3 mt-4 px-3 py-3 rounded-3"
              style={{ background: '#f8fafc' }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                style={{ width: 44, height: 44, fontSize: '1rem', background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
              >
                {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="flex-grow-1 overflow-hidden">
                <div className="fw-semibold text-truncate">{profile?.full_name ?? 'Usuário'}</div>
                <div className="text-muted small">
                  {profile?.role === 'platform_admin' ? 'Administrador' : 'Conta pessoal'}
                </div>
              </div>
              <button
                className="btn btn-sm d-flex align-items-center gap-1 text-danger"
                style={{ fontSize: '0.8rem' }}
                onClick={handleSignOut}
              >
                <LogOut size={15} />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
