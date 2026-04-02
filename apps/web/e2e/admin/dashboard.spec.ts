import { test, expect } from '@playwright/test';

test('admin dashboard loads with metrics', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await expect(page.locator('h2', { hasText: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Citas hoy')).toBeVisible();
  await expect(page.getByText('Ingresos hoy')).toBeVisible();
  await expect(page.getByText('Calificacion')).toBeVisible();
  await expect(page.getByText('Estatus')).toBeVisible();
});
