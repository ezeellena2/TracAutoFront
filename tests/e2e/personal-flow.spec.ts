import { expect, test } from '@playwright/test';
import { installIdentityMocks, seedPersistedSession, sessions } from './helpers/auth-context-fixtures';
import { clickSidebarLink, expandSidebarGroup } from './helpers/navigation';

test.describe('personal context flow', () => {
  test('navigates the personal tracking surfaces with contextual empty states', async ({ page }) => {
    const session = sessions.personalPure();
    await seedPersistedSession(page, session);
    await installIdentityMocks(page, { session });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Mi espacio personal' })).toBeVisible({ timeout: 15000 });

    await expandSidebarGroup(page, 'seguimiento');

    const pages = [
      {
        key: 'vehiculos',
        path: '/vehiculos',
        text: /Todavia no cargaste vehiculos propios/i,
      },
      {
        key: 'dispositivos',
        path: '/dispositivos',
        text: /Todavia no vinculaste dispositivos propios/i,
      },
      {
        key: 'mapa',
        path: '/mapa',
        text: /Todavia no hay posiciones personales para mostrar/i,
      },
      {
        key: 'geozonas',
        path: '/geozonas',
        text: /Todavia no creaste geozonas personales/i,
      },
      {
        key: 'conductores',
        path: '/conductores',
        text: /Todavia no cargaste conductores personales/i,
      },
    ];

    for (const current of pages) {
      await clickSidebarLink(page, current.key, current.path);
      await expect(page.getByText(current.text)).toBeVisible();
    }
  });

  test('shows personal subscription catalog copy without organization-only actions', async ({ page }) => {
    const session = sessions.personalPure();
    await seedPersistedSession(page, session);
    await installIdentityMocks(page, { session });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Mi espacio personal' })).toBeVisible({ timeout: 15000 });
    await clickSidebarLink(page, 'suscripcion', '/suscripcion');

    await expect(page.getByRole('heading', { name: /Modulos disponibles/i })).toBeVisible();
    await expect(page.getByText(/Estas viendo el catalogo de tu contexto personal/i)).toBeVisible();
    await expect(page.getByText(/Todavia no hay modulos personales operativos/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Activar|Desactivar/i })).toHaveCount(0);
  });
});
