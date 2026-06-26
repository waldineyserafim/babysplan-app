import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthLayout } from '@/shared/components/Layout/AuthLayout'
import { AppLayout } from '@/shared/components/Layout/AppLayout'
import { useAuth, AuthProvider } from '@/shared/hooks/useAuth'
import { useCurrentPregnancy } from '@/shared/hooks/useCurrentPregnancy'
import { ROUTES } from '@/shared/constants/routes'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/shared/styles/theme.css'

const LoginPage = lazy(() => import('@/features/auth/components/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/components/RegisterPage').then(m => ({ default: m.RegisterPage })))
const OnboardingPage = lazy(() => import('@/features/auth/components/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/components/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/components/DashboardPage').then(m => ({ default: m.DashboardPage })))
const BabyDevelopmentPage = lazy(() => import('@/features/baby-development/components/BabyDevelopmentPage').then(m => ({ default: m.BabyDevelopmentPage })))
const KicksPage = lazy(() => import('@/features/kicks/components/KicksPage').then(m => ({ default: m.KicksPage })))
const ContractionsPage = lazy(() => import('@/features/contractions/components/ContractionsPage').then(m => ({ default: m.ContractionsPage })))
const LayetteIntelligencePage = lazy(() => import('@/features/layette-intelligence/components/LayetteIntelligencePage').then(m => ({ default: m.LayetteIntelligencePage })))
const AppointmentsPage = lazy(() => import('@/features/appointments/components/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })))
const ExamsPage = lazy(() => import('@/features/exams/components/ExamsPage').then(m => ({ default: m.ExamsPage })))
const VaccinesPage = lazy(() => import('@/features/vaccines/components/VaccinesPage').then(m => ({ default: m.VaccinesPage })))
const SymptomsPage = lazy(() => import('@/features/symptoms/components/SymptomsPage').then(m => ({ default: m.SymptomsPage })))
const PhotosPage = lazy(() => import('@/features/photos/components/PhotosPage').then(m => ({ default: m.PhotosPage })))
const DiaryPage = lazy(() => import('@/features/diary/components/DiaryPage').then(m => ({ default: m.DiaryPage })))
const HospitalBagPage = lazy(() => import('@/features/hospital-bag/components/HospitalBagPage').then(m => ({ default: m.HospitalBagPage })))
const BirthPlanPage = lazy(() => import('@/features/birth-plan/components/BirthPlanPage').then(m => ({ default: m.BirthPlanPage })))
const DocumentsPage = lazy(() => import('@/features/documents/components/DocumentsPage').then(m => ({ default: m.DocumentsPage })))
const InternationalMovePage = lazy(() => import('@/features/international-move/components/InternationalMovePage').then(m => ({ default: m.InternationalMovePage })))
const NotificationsPage = lazy(() => import('@/features/notifications/components/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const TimelinePage = lazy(() => import('@/features/timeline/components/TimelinePage').then(m => ({ default: m.TimelinePage })))
const LayettePage = lazy(() => import('@/features/layette/components/LayettePage').then(m => ({ default: m.LayettePage })))
const ReportsPage = lazy(() => import('@/features/reports/components/ReportsPage').then(m => ({ default: m.ReportsPage })))
const AdminPage = lazy(() => import('@/features/admin/components/AdminPage').then(m => ({ default: m.AdminPage })))
const SettingsPage = lazy(() => import('@/features/settings/components/SettingsPage').then(m => ({ default: m.SettingsPage })))
const JoinPage = lazy(() => import('@/features/join/components/JoinPage').then(m => ({ default: m.JoinPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function Spinner() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-border bp-spinner" role="status">
        <span className="visually-hidden">Carregando...</span>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Spinner />
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Spinner />
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />
  return <>{children}</>
}

// Guards app routes: redirects to /onboarding if user has no profile or no active pregnancy
function RequireSetup() {
  const { profile, loading: authLoading } = useAuth()
  const { data: pregnancy, isLoading: pregnancyLoading } = useCurrentPregnancy()

  if (authLoading) return <Spinner />

  // No profile or no tenant → needs full setup (new Google OAuth user)
  if (!profile || !profile.tenant_id) return <Navigate to={ROUTES.ONBOARDING} replace />

  if (pregnancyLoading) return <Spinner />

  // Profile exists but no pregnancy → needs onboarding
  if (!pregnancy) return <Navigate to={ROUTES.ONBOARDING} replace />

  return <Outlet />
}

function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public auth pages */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path={ROUTES.REGISTER} element={<PublicRoute><RegisterPage /></PublicRoute>} />
        </Route>

        {/* Standalone pages (no AppLayout) */}
        <Route path={ROUTES.ONBOARDING} element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path="/join/:code" element={<JoinPage />} />

        {/* App pages — require auth + profile + active pregnancy */}
        <Route element={<ProtectedRoute><RequireSetup /></ProtectedRoute>}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.BABY_DEVELOPMENT} element={<BabyDevelopmentPage />} />
            <Route path={ROUTES.BABY_DEVELOPMENT_WEEK} element={<BabyDevelopmentPage />} />
            <Route path={ROUTES.TIMELINE} element={<TimelinePage />} />
            <Route path={ROUTES.APPOINTMENTS} element={<AppointmentsPage />} />
            <Route path={ROUTES.EXAMS} element={<ExamsPage />} />
            <Route path={ROUTES.VACCINES} element={<VaccinesPage />} />
            <Route path={ROUTES.SYMPTOMS} element={<SymptomsPage />} />
            <Route path={ROUTES.PHOTOS} element={<PhotosPage />} />
            <Route path={ROUTES.DIARY} element={<DiaryPage />} />
            <Route path={ROUTES.KICKS} element={<KicksPage />} />
            <Route path={ROUTES.CONTRACTIONS} element={<ContractionsPage />} />
            <Route path={ROUTES.LAYETTE} element={<LayettePage />} />
            <Route path={ROUTES.LAYETTE_INTELLIGENCE} element={<LayetteIntelligencePage />} />
            <Route path={ROUTES.HOSPITAL_BAG} element={<HospitalBagPage />} />
            <Route path={ROUTES.BIRTH_PLAN} element={<BirthPlanPage />} />
            <Route path={ROUTES.DOCUMENTS} element={<DocumentsPage />} />
            <Route path={ROUTES.INTERNATIONAL_MOVE} element={<InternationalMovePage />} />
            <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            <Route path={ROUTES.ADMIN} element={<AdminPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename="/">
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
