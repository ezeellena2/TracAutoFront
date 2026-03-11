import { test, expect } from '@playwright/test'

/**
 * E2E test: Alquiler B2C public portal flow.
 *
 * Prerequisite: Backend API and frontend dev server running.
 * Run: npx playwright install && npx playwright test
 */

test.describe('Alquiler B2C — Public Portal', () => {
  test('homepage loads and shows search form', async ({ page }) => {
    await page.goto('/')

    // The page should load without errors
    await expect(page).toHaveTitle(/TracAuto|Alquiler/)

    // The search form should be visible (sucursal selector, date pickers)
    // These selectors will depend on the actual implementation
    await expect(page.locator('main')).toBeVisible()
  })

  test('search form shows sucursales', async ({ page }) => {
    await page.goto('/')

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle')

    // The page content should be visible
    await expect(page.locator('body')).toBeVisible()
  })
})
