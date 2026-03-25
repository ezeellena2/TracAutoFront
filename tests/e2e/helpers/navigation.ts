import { expect, type Page } from '@playwright/test';

export async function openUserMenu(page: Page) {
  await page.getByTestId('user-menu-trigger').click();
  await expect(page.getByTestId('user-menu-dropdown')).toBeVisible();
}

export async function switchContext(page: Page, contextKey: string) {
  await openUserMenu(page);
  await page.getByTestId(`context-option-${contextKey}`).click();
  await expect(page.getByTestId('user-menu-dropdown')).toBeHidden();
}

export async function clickSidebarLink(page: Page, key: string, expectedPath: string) {
  await page.getByTestId(`sidebar-link-${key}`).click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(expectedPath)}$`));
}

export async function expandSidebarGroup(page: Page, key: string) {
  await page.getByTestId(`sidebar-group-${key}`).click();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
