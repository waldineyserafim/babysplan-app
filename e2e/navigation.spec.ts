/**
 * Full navigation E2E tests — verifica que todas as páginas da app
 * carregam sem erro e têm o heading correto.
 */
import { test, expect } from '@playwright/test'
import { url, login, isMobileViewport, requireCredentials } from './helpers'

test.describe('Navegação completa — todas as páginas', () => {
  test.beforeEach(async ({ page }) => {
    if (!requireCredentials()) return test.skip()
    await login(page)
  })

  // Tuple: [route, expected heading regex]
  const pages: [string, RegExp][] = [
    ['/dashboard', /início|dashboard|semana/i],
    ['/appointments', /consultas/i],
    ['/exams', /exames/i],
    ['/vaccines', /vacinas/i],
    ['/symptoms', /sintomas/i],
    ['/kicks', /chutômetro|chutes/i],
    ['/contractions', /contrações/i],
    ['/diary', /diário/i],
    ['/photos', /fotos/i],
    ['/layette', /enxoval/i],
    ['/hospital-bag', /mala/i],
    ['/birth-plan', /plano de parto/i],
    ['/documents', /documentos/i],
    ['/timeline', /linha do tempo|timeline/i],
    ['/notifications', /notificações/i],
    ['/reports', /relatório/i],
    ['/settings', /configurações/i],
    ['/baby-development', /desenvolvimento/i],
  ]

  for (const [route, headingRe] of pages) {
    test(`${route} carrega e exibe heading`, async ({ page }) => {
      await page.goto(url(route))
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 })
      await expect(page.getByRole('heading', { name: headingRe }).first()).toBeVisible({ timeout: 10000 })
    })
  }

  test('/baby-development/:week exibe semana específica', async ({ page }) => {
    await page.goto(url('/baby-development/20'))
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/semana 20/i).first()).toBeVisible({ timeout: 8000 })
  })

  test('rota inválida redireciona para /dashboard', async ({ page }) => {
    await page.goto(url('/rota-que-nao-existe-xyz'))
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })
})

test.describe('Navegação — layout desktop', () => {
  test.beforeEach(async ({ page }) => {
    if (!requireCredentials()) return test.skip()
    await login(page)
  })

  test('sidebar exibe todos os links principais', async ({ page }) => {
    if (isMobileViewport(page)) return test.skip()
    const links = [
      /consultas/i, /exames/i, /vacinas/i, /sintomas/i,
      /diário/i, /fotos/i, /enxoval/i,
    ]
    for (const re of links) {
      await expect(page.getByRole('link', { name: re }).first()).toBeVisible()
    }
  })
})

test.describe('Navegação — layout mobile', () => {
  test.beforeEach(async ({ page }) => {
    if (!requireCredentials()) return test.skip()
    await login(page)
  })

  test('bottom nav exibe ícones principais', async ({ page }) => {
    if (!isMobileViewport(page)) return test.skip()
    await expect(page.getByRole('link', { name: /início/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /consultas/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /diário/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /fotos/i })).toBeVisible()
  })

  test('menu "Mais" lista as demais páginas', async ({ page }) => {
    if (!isMobileViewport(page)) return test.skip()
    await page.getByRole('button', { name: /mais/i }).click()
    await expect(page.getByText('Menu')).toBeVisible()
    const extraLinks = [/exames/i, /vacinas/i, /enxoval/i, /mala/i]
    for (const re of extraLinks) {
      await expect(page.getByRole('link', { name: re })).toBeVisible()
    }
  })
})

test.describe('Navegação — ausência de erros no console', () => {
  test.beforeEach(async ({ page }) => {
    if (!requireCredentials()) return test.skip()
    await login(page)
  })

  test('dashboard não emite console.error', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto(url('/dashboard'))
    await page.waitForLoadState('networkidle')
    // Filter out known/harmless browser extension errors
    const realErrors = errors.filter(e =>
      !e.includes('extension') &&
      !e.includes('favicon')
    )
    expect(realErrors).toHaveLength(0)
  })

  test('page de consultas não tem erros críticos', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto(url('/appointments'))
    await page.waitForLoadState('networkidle')
    const realErrors = errors.filter(e =>
      !e.includes('extension') &&
      !e.includes('favicon')
    )
    expect(realErrors).toHaveLength(0)
  })
})
