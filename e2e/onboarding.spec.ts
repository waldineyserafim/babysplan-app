import { test, expect } from '@playwright/test'
import { url, requireCredentials } from './helpers'

test.describe('Onboarding — validação de formulário', () => {
  // These tests only need the app running — no real credentials
  test('redireciona para login quando não autenticado', async ({ page }) => {
    await page.goto(url('/onboarding'))
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('exibe campos obrigatórios', async ({ page }) => {
    test.skip(!requireCredentials(), 'Requer TEST_EMAIL e TEST_PASSWORD')

    // Login first
    const { login } = await import('./helpers')
    await login(page)

    // If user already has pregnancy, they'll be redirected — skip
    const isOnboarding = page.url().includes('/onboarding')
    if (!isOnboarding) return test.skip()

    await expect(page.getByText(/configure sua gestação/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByPlaceholder(/bebê|aurora|miguelzinho/i)).toBeVisible()
    await expect(page.locator('input[type="date"]')).toBeVisible()
  })

  test('seletor de sexo tem três opções como botões', async ({ page }) => {
    test.skip(!requireCredentials(), 'Requer TEST_EMAIL e TEST_PASSWORD')

    const { login } = await import('./helpers')
    await login(page)

    if (!page.url().includes('/onboarding')) return test.skip()

    await expect(page.getByText('Surpresa')).toBeVisible()
    await expect(page.getByText('Menino')).toBeVisible()
    await expect(page.getByText('Menina')).toBeVisible()
  })

  test('preview da data provável do parto aparece ao preencher DUM', async ({ page }) => {
    test.skip(!requireCredentials(), 'Requer TEST_EMAIL e TEST_PASSWORD')

    const { login } = await import('./helpers')
    await login(page)

    if (!page.url().includes('/onboarding')) return test.skip()

    const dateInput = page.locator('input[type="date"]')
    await dateInput.fill('2026-01-01')
    await expect(page.getByText(/data provável do parto/i)).toBeVisible({ timeout: 3000 })
    await expect(page.getByText(/10\/10\/2026/i)).toBeVisible()
  })

  test('submit sem preencher campos exibe erros de validação', async ({ page }) => {
    test.skip(!requireCredentials(), 'Requer TEST_EMAIL e TEST_PASSWORD')

    const { login } = await import('./helpers')
    await login(page)

    if (!page.url().includes('/onboarding')) return test.skip()

    await page.getByRole('button', { name: /começar minha jornada/i }).click()
    await expect(page.getByText(/informe um nome/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/informe a data/i)).toBeVisible({ timeout: 3000 })
  })

  test('clicar em Menino seleciona e destaca o botão', async ({ page }) => {
    test.skip(!requireCredentials(), 'Requer TEST_EMAIL e TEST_PASSWORD')

    const { login } = await import('./helpers')
    await login(page)

    if (!page.url().includes('/onboarding')) return test.skip()

    const meninoBtn = page.getByText('Menino').locator('..')
    await meninoBtn.click()
    // Button should have the selected outline color
    await expect(meninoBtn).toHaveCSS('outline-color', 'rgb(124, 58, 237)')
  })
})

test.describe('Onboarding — usuário com gestação existente', () => {
  test('redireciona para dashboard imediatamente', async ({ page }) => {
    test.skip(!requireCredentials(), 'Requer TEST_EMAIL e TEST_PASSWORD')

    const { login } = await import('./helpers')
    await login(page)

    // User that completed onboarding should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

    // Navigating to /onboarding must redirect back to dashboard
    await page.goto(url('/onboarding'))
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })
})
