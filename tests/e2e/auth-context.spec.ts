import { expect, test } from '@playwright/test';
import { installIdentityMocks, seedPersistedSession, sessions } from './helpers/auth-context-fixtures';
import { clickSidebarLink, expandSidebarGroup, switchContext } from './helpers/navigation';

test.describe('identity and context architecture', () => {
  test('activates an account and lands in personal context', async ({ page }) => {
    await installIdentityMocks(page, { session: sessions.personalPure() });

    await page.goto('/activar-cuenta?token=activation-ok');

    await expect(page.locator('h1')).toContainText('Activ', { timeout: 15000 });
    await page.locator('input[type="password"]').nth(0).fill('Secret123!');
    await page.locator('input[type="password"]').nth(1).fill('Secret123!');
    await page.getByRole('button', { name: /Activar cuenta/i }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Mi espacio personal' })).toBeVisible();

    await expect.poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('tracauto-auth'));
      return raw ?? '';
    }).toContain('"isAuthenticated":true');
  });

  test('resends verification code for a pure personal user when login requires verification', async ({ page }) => {
    const controller = await installIdentityMocks(page, {
      session: sessions.personalPure(),
      loginMode: 'not-verified',
    });

    await page.goto('/login');
    await page.locator('input[name="email"]').fill('personal@tracauto.test');
    await page.locator('input[name="password"]').fill('Secret123!');
    await page.getByRole('button', { name: /sign in|ingresar|iniciar sesi/i }).click();

    await expect(page).toHaveURL(/\/registro$/);
    expect(controller.getLastReenviarCodigoBody()).toEqual({
      email: 'personal@tracauto.test',
      canal: 1,
    });
  });

  test('logs in with multiple contexts and switches personal to organization and back', async ({ page }) => {
    await installIdentityMocks(page, { session: sessions.multiContext() });

    await page.goto('/login');
    await page.locator('input[name="email"]').fill('multi@tracauto.test');
    await page.locator('input[name="password"]').fill('Secret123!');
    await page.getByRole('button', { name: /sign in|ingresar|iniciar sesi/i }).click();

    await expect(page.getByRole('heading', { name: 'Mi espacio personal' })).toBeVisible();
    await switchContext(page, 'Organizacion:org-1');

    await expect(page.getByRole('banner').getByText('Acme Fleet')).toBeVisible();
    await expect(page.getByText(/Estas operando dentro de una organizacion/i)).toBeVisible();

    await expandSidebarGroup(page, 'organizacion');
    await clickSidebarLink(page, 'organizacion-relaciones', '/configuracion/empresa/relaciones');
    await expect(page.getByRole('heading', { name: /Relaciones/i })).toBeVisible();

    await switchContext(page, 'Personal:personal');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Mi espacio personal' })).toBeVisible();
  });

  test('preserves the active organization context after refresh via auth refresh flow', async ({ page }) => {
    const session = sessions.multiContext();
    session.activeContextKey = 'Organizacion:org-1';

    await seedPersistedSession(page, session);
    const controller = await installIdentityMocks(page, {
      session,
      requireAuthorizationOnDataRequests: true,
    });

    await page.goto('/vehiculos');
    await expect(page.getByRole('banner').getByText('Acme Fleet')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vehiculos', exact: true })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('banner').getByText('Acme Fleet')).toBeVisible();
    await expect.poll(() => controller.getRefreshCount()).toBeGreaterThanOrEqual(2);

    await expect.poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem('tracauto-auth'));
      return raw ?? '';
    }).toContain('"organizationId":"org-1"');
  });
});
