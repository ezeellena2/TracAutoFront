import { expect, test } from '@playwright/test';
import { installIdentityMocks, seedPersistedSession, sessions } from './helpers/auth-context-fixtures';

test.describe('organization guardrails', () => {
  test('keeps organization-only screens and admin actions unavailable in personal context', async ({ page }) => {
    const session = sessions.personalPure();
    await seedPersistedSession(page, session);
    await installIdentityMocks(page, { session });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Mi espacio personal' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('sidebar-link-marketplace')).toHaveCount(0);
    await expect(page.getByTestId('sidebar-group-organizacion')).toHaveCount(0);
    await expect(page.getByTestId('sidebar-link-importaciones')).toHaveCount(0);

    for (const protectedPath of ['/usuarios', '/configuracion/empresa/relaciones', '/importaciones', '/marketplace']) {
      await page.goto(protectedPath);
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: 'Mi espacio personal' })).toBeVisible({ timeout: 15000 });
    }

    await page.goto('/suscripcion');
    await expect(page.getByRole('button', { name: /Activar|Desactivar/i })).toHaveCount(0);
  });

  test('prevents a non-admin organization user from opening admin-only routes', async ({ page }) => {
    const session = sessions.orgOperator();
    await seedPersistedSession(page, session);
    await installIdentityMocks(page, {
      session,
      requireAuthorizationOnDataRequests: true,
    });

    await page.goto('/');
    await expect(page.getByRole('banner').getByText('Beta Logistics')).toBeVisible();
    await expect(page.getByTestId('sidebar-group-seguimiento')).toBeVisible();
    await expect(page.getByTestId('sidebar-group-organizacion')).toHaveCount(0);
    await expect(page.getByTestId('sidebar-link-usuarios')).toHaveCount(0);

    for (const protectedPath of ['/usuarios', '/configuracion/empresa/relaciones', '/suscripcion']) {
      await page.goto(protectedPath);
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('banner').getByText('Beta Logistics')).toBeVisible();
    }
  });
});
