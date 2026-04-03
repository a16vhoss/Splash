import { test, expect } from '@playwright/test';

test.describe('Admin mobile tab bar', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('bottom tab bar is visible on mobile', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Tab bar should be visible
    await expect(page.getByText('Dashboard').last()).toBeVisible();
    await expect(page.getByText('Citas').last()).toBeVisible();
    await expect(page.getByText('Servicios').last()).toBeVisible();
    await expect(page.getByText('Mas').last()).toBeVisible();
  });

  test('sidebar is hidden on mobile', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Sidebar text "Panel admin" should not be visible
    await expect(page.getByText('Panel admin')).not.toBeVisible();
  });

  test('Mas button opens bottom sheet with logout', async ({ page }) => {
    await page.goto('/admin/dashboard');

    await page.getByRole('button', { name: 'Mas' }).click();

    // Bottom sheet should show menu items
    await expect(page.getByRole('link', { name: 'Reportes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Configuracion' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar sesion' })).toBeVisible();
  });

  test('tab navigation works', async ({ page }) => {
    await page.goto('/admin/dashboard');

    await page.getByRole('link', { name: 'Citas' }).last().click();
    await page.waitForURL('/admin/citas');
    await expect(page).toHaveURL('/admin/citas');

    await page.getByRole('link', { name: 'Servicios' }).last().click();
    await page.waitForURL('/admin/servicios');
    await expect(page).toHaveURL('/admin/servicios');
  });
});
