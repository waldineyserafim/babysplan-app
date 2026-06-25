export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',

  DASHBOARD: '/dashboard',

  BABY_DEVELOPMENT: '/baby-development',
  BABY_DEVELOPMENT_WEEK: '/baby-development/:week',

  TIMELINE: '/timeline',

  APPOINTMENTS: '/appointments',
  APPOINTMENTS_NEW: '/appointments/new',
  APPOINTMENTS_EDIT: '/appointments/:id/edit',

  EXAMS: '/exams',
  EXAMS_NEW: '/exams/new',

  VACCINES: '/vaccines',

  SYMPTOMS: '/symptoms',

  PHOTOS: '/photos',

  DIARY: '/diary',
  DIARY_ENTRY: '/diary/:date',

  KICKS: '/kicks',

  CONTRACTIONS: '/contractions',

  LAYETTE: '/layette',
  LAYETTE_INTELLIGENCE: '/layette/intelligence',

  HOSPITAL_BAG: '/hospital-bag',

  BIRTH_PLAN: '/birth-plan',

  DOCUMENTS: '/documents',

  INTERNATIONAL_MOVE: '/international-move',

  NOTIFICATIONS: '/notifications',

  REPORTS: '/reports',

  ADMIN: '/admin',
  ADMIN_TENANTS: '/admin/tenants',
  ADMIN_CONTENT: '/admin/content',

  SETTINGS: '/settings',
  JOIN: '/join/:code',
} as const
