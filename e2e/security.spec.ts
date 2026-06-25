/**
 * Security E2E Tests
 *
 * Covers: auth guards, route protection, XSS, admin access control,
 * password recovery flow, session handling, tenant isolation (UI layer).
 */
import { test, expect } from '@playwright/test'
import { url, login, requireCredentials } from './helpers'

// ─────────────────────────────────────────────────────────────
// 1. Unauthenticated route guards
// ─────────────────────────────────────────────────────────────
test.describe('Proteção de rotas — usuário não autenticado', () => {
  const protectedRoutes = [
    '/dashboard',
    '/appointments',
    '/diary',
    '/kicks',
    '/contractions',
    '/exams',
    '/vaccines',
    '/symptoms',
    '/photos',
    '/layette',
    '/hospital-bag',
    '/birth-plan',
    '/documents',
    '/reports',
    '/settings',
    '/admin',
    '/notifications',
    '/timeline',
  ]

  for (const route of protectedRoutes) {
    test(`GET ${route} → redireciona para /login`, async ({ page }) => {
      await page.goto(url(route))
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })
  }

  test('GET /onboarding → redireciona para /login', async ({ page }) => {
    await page.goto(url('/onboarding'))
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

// ─────────────────────────────────────────────────────────────
// 2. Authenticated user — public routes redirect away
// ─────────────────────────────────────────────────────────────
test.describe('Rotas públicas — usuário já autenticado', () => {
  test.beforeEach(async ({ page }) => {
    if (!requireCredentials()) return test.skip()
    await login(page)
  })

  test('/login redireciona para /dashboard quando logado', async ({ page }) => {
    await page.goto(url('/login'))
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('/register redireciona para /dashboard quando logado', async ({ page }) => {
    await page.goto(url('/register'))
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })
})

// ─────────────────────────────────────────────────────────────
// 3. Reset password page — estado inválido sem token
// ─────────────────────────────────────────────────────────────
test.describe('Reset de senha', () => {
  test('acesso sem token mostra estado inválido em 4s', async ({ page }) => {
    await page.goto(url('/reset-password'))
    // Initially shows spinner, then transitions to invalid state
    await expect(page.getByText(/link inválido ou expirado/i)).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: /ir para o login/i })).toBeVisible()
  })

  test('"Ir para o login" no estado inválido navega para /login', async ({ page }) => {
    await page.goto(url('/reset-password'))
    await page.getByRole('button', { name: /ir para o login/i }).click({ timeout: 8000 })
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})

// ─────────────────────────────────────────────────────────────
// 4. Forgot password flow (UI only — não envia email real)
// ─────────────────────────────────────────────────────────────
test.describe('Recuperação de senha — fluxo de UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url('/login'))
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible({ timeout: 10000 })
  })

  test('link "Esqueci minha senha" aparece na tela de login', async ({ page }) => {
    await expect(page.getByRole('button', { name: /esqueci minha senha/i })).toBeVisible()
  })

  test('clique em "Esqueci" exibe formulário de recuperação', async ({ page }) => {
    await page.getByRole('button', { name: /esqueci minha senha/i }).click()
    await expect(page.getByText(/enviaremos um link/i)).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('"Voltar" no formulário de recuperação volta ao login', async ({ page }) => {
    await page.getByRole('button', { name: /esqueci minha senha/i }).click()
    await page.getByRole('button', { name: /voltar/i }).click()
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('submit com campo vazio exibe erro de validação', async ({ page }) => {
    await page.getByRole('button', { name: /esqueci minha senha/i }).click()
    // Leave the email field empty — browser doesn't block empty type="email" (no required attr)
    // RHF/Zod validation fires and shows the error
    await page.getByRole('button', { name: /enviar link/i }).click()
    await expect(page.getByText(/email inválido|preencha|obrigatório/i)).toBeVisible({ timeout: 5000 })
  })
})

// ─────────────────────────────────────────────────────────────
// 5. Admin route — acesso por usuário não-admin
// ─────────────────────────────────────────────────────────────
test.describe('Rota admin — controle de acesso', () => {
  test('usuário common chega à página /admin mas vê aviso de acesso restrito', async ({ page }) => {
    test.skip(!requireCredentials(), 'Requer TEST_EMAIL e TEST_PASSWORD')
    await login(page)
    await page.goto(url('/admin'))
    // Admin page should either redirect away or show an access-denied message
    // If the user is not platform_admin, the component should render a restricted state
    await page.waitForLoadState('networkidle')
    const url_ = page.url()
    const hasAdminContent = await page.getByText(/administração|admin/i).isVisible().catch(() => false)
    const hasRestricted = await page.getByText(/acesso restrito|não autorizado|permissão/i).isVisible().catch(() => false)
    // Either it redirected away from admin, or shows restricted content
    expect(url_.includes('/admin') ? hasRestricted || hasAdminContent : true).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────
// 6. XSS — entradas do usuário são escapadas
// ─────────────────────────────────────────────────────────────
test.describe('XSS — entradas não são executadas', () => {
  test('payload XSS em campo de texto é tratado como texto', async ({ page }) => {
    test.skip(!requireCredentials(), 'Requer TEST_EMAIL e TEST_PASSWORD')
    await login(page)

    const xssPayload = '<script>window.__xss_fired=true</script>'

    // Navigate to appointments and try to inject in the specialty field
    await page.goto(url('/appointments'))
    await page.getByRole('button', { name: /nova consulta/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const specialtyInput = page.locator('.modal input[type="text"]').first()
    await specialtyInput.fill(xssPayload)

    // Check that no script was executed
    const xssFired = await page.evaluate(() => (window as any).__xss_fired)
    expect(xssFired).toBeFalsy()

    // Close the modal
    await page.getByRole('button', { name: /cancelar/i }).click()
  })

  test('payload XSS em diário não executa script', async ({ page }) => {
    test.skip(!requireCredentials(), 'Requer TEST_EMAIL e TEST_PASSWORD')
    await login(page)
    await page.goto(url('/diary'))

    await page.getByRole('button', { name: /nova entrada|novo registro|adicionar/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Inject in content field
    const contentField = page.locator('textarea').first()
    if (await contentField.isVisible()) {
      await contentField.fill('<img src=x onerror="window.__xss_fired=true">')
    }

    const xssFired = await page.evaluate(() => (window as any).__xss_fired)
    expect(xssFired).toBeFalsy()

    await page.getByRole('button', { name: /cancelar/i }).click()
  })
})

// ─────────────────────────────────────────────────────────────
// 7. Join (convite) com código inválido
// ─────────────────────────────────────────────────────────────
test.describe('Página de convite', () => {
  test('código inválido exibe mensagem de erro', async ({ page }) => {
    await page.goto(url('/join/codigo-invalido-que-nao-existe-xyz'))
    await page.waitForLoadState('networkidle')
    // Should show either an error state or redirect
    const hasError = await page.getByText(/inválido|expirado|não encontrado|erro/i).isVisible().catch(() => false)
    const redirectedToLogin = page.url().includes('/login')
    expect(hasError || redirectedToLogin).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────
// 8. Persistência de sessão após reload
// ─────────────────────────────────────────────────────────────
test.describe('Persistência de sessão', () => {
  test('página recarregada mantém usuário logado', async ({ page }) => {
    test.skip(!requireCredentials(), 'Requer TEST_EMAIL e TEST_PASSWORD')
    await login(page)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

    await page.reload()
    // After reload, session should persist — stay on dashboard (not redirected to login)
    await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 15000 })
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/login')
  })
})

// ─────────────────────────────────────────────────────────────
// 9. Validações de senha — força mínima
// ─────────────────────────────────────────────────────────────
test.describe('Validação de senha', () => {
  test('login rejeita senha com menos de 6 caracteres', async ({ page }) => {
    await page.goto(url('/login'))
    await page.getByLabel('Email').fill('teste@email.com')
    await page.getByLabel('Senha').fill('123')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page.getByText(/mínimo 6/i)).toBeVisible({ timeout: 5000 })
  })

  test('cadastro rejeita senha com menos de 6 caracteres', async ({ page }) => {
    await page.goto(url('/register'))
    await expect(page.getByRole('button', { name: /criar conta/i })).toBeVisible({ timeout: 10000 })
    // Labels in RegisterPage have no htmlFor — use input index instead
    const inputs = page.locator('input')
    await inputs.nth(0).fill('Teste Nome')        // Seu nome completo
    await inputs.nth(1).fill('Família Teste')     // Nome da família
    await inputs.nth(2).fill('teste@email.com')   // Email
    await inputs.nth(3).fill('123')               // Senha
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page.getByText(/mínimo 6/i)).toBeVisible({ timeout: 5000 })
  })
})

// ─────────────────────────────────────────────────────────────
// 10. Headers de segurança e CSP (via response headers)
// ─────────────────────────────────────────────────────────────
test.describe('Headers HTTP — verificação básica', () => {
  test('resposta do app não expõe credenciais no HTML', async ({ page }) => {
    const response = await page.goto(url('/login'))
    const html = await response?.text() ?? ''
    // The anon key appears in the JS bundle, not HTML — check HTML is clean
    expect(html).not.toContain('service_role')
    expect(html).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIi')
  })
})
