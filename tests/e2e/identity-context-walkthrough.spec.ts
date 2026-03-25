import { expect, test } from '@playwright/test';
import { installIdentityMocks, sessions } from './helpers/auth-context-fixtures';
import { clickSidebarLink, expandSidebarGroup, switchContext } from './helpers/navigation';

test.describe('identity/context walkthrough', () => {
  test('walks through the main identity and context routine end to end', async ({ page }) => {
    test.slow();

    await installIdentityMocks(page, { session: sessions.multiContext() });

    await page.goto('/activar-cuenta?token=activation-ok');
    await expect(page.locator('h1')).toContainText('Activ', { timeout: 15000 });
    await page.locator('input[type="password"]').nth(0).fill('Secret123!');
    await page.locator('input[type="password"]').nth(1).fill('Secret123!');
    await page.getByRole('button', { name: /Activar cuenta/i }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Mi espacio personal' })).toBeVisible();
    await expect(page.getByText(/Estas usando tu contexto personal/i)).toBeVisible();

    await expandSidebarGroup(page, 'seguimiento');
    await clickSidebarLink(page, 'vehiculos', '/vehiculos');
    await expect(page.getByText(/Todavia no cargaste vehiculos propios/i)).toBeVisible();

    await clickSidebarLink(page, 'dispositivos', '/dispositivos');
    await expect(page.getByText(/Todavia no vinculaste dispositivos propios/i)).toBeVisible();

    await clickSidebarLink(page, 'mapa', '/mapa');
    await expect(page.getByText(/Todavia no hay posiciones personales para mostrar/i)).toBeVisible();

    await clickSidebarLink(page, 'geozonas', '/geozonas');
    await expect(page.getByText(/Todavia no creaste geozonas personales/i)).toBeVisible();

    await clickSidebarLink(page, 'conductores', '/conductores');
    await expect(page.getByText(/Todavia no cargaste conductores personales/i)).toBeVisible();

    await clickSidebarLink(page, 'suscripcion', '/suscripcion');
    await expect(page.getByText(/Estas viendo el catalogo de tu contexto personal/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Activar|Desactivar/i })).toHaveCount(0);

    await switchContext(page, 'Organizacion:org-1');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('banner').getByText('Acme Fleet')).toBeVisible();
    await expect(page.getByText(/Estas operando dentro de una organizacion/i)).toBeVisible();

    await expandSidebarGroup(page, 'seguimiento');
    await clickSidebarLink(page, 'vehiculos', '/vehiculos');
    await expect(page.getByRole('heading', { name: 'Vehiculos', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Agregar vehiculo/i }).first()).toBeVisible();

    await clickSidebarLink(page, 'marketplace', '/marketplace');
    await expect(page.getByRole('heading', { name: /Marketplace/i })).toBeVisible();

    await expandSidebarGroup(page, 'organizacion');
    await clickSidebarLink(page, 'organizacion-relaciones', '/configuracion/empresa/relaciones');
    await expect(page.getByRole('heading', { name: /Relaciones/i })).toBeVisible();

    await clickSidebarLink(page, 'organizacion-solicitudes-cambio', '/configuracion/empresa/solicitudes-cambio');
    await expect(page.getByRole('heading', { name: /Solicitudes/i })).toBeVisible();

    await switchContext(page, 'Personal:personal');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Mi espacio personal' })).toBeVisible();

    await page.goto('/usuarios');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Mi espacio personal' })).toBeVisible();
  });
});
