import { test, expect } from '@playwright/test';

test.describe('Admin analytics breakdowns', () => {
  test('dashboard renders period cards and top services card', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // Period card labels
    await expect(page.getByText('Hoy', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Esta semana', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Este mes', { exact: true }).first()).toBeVisible();
    // Top services card heading
    await expect(page.getByText('Top servicios del mes')).toBeVisible();
    // Existing section still present
    await expect(page.getByText('Proximas citas')).toBeVisible();
  });

  test('reportes: period toggle switches grouping without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/admin/reportes');
    await expect(page.getByText('Reportes y Analiticas')).toBeVisible();

    // Wait for initial analytics fetch
    await page.waitForResponse(
      (r) => r.url().includes('/api/admin/analytics') && r.status() === 200,
      { timeout: 10000 }
    );

    // Click the "Semana" toggle button
    await page.getByRole('button', { name: 'Semana' }).click();
    await page.waitForResponse(
      (r) => r.url().includes('group_by=week') && r.status() === 200,
      { timeout: 10000 }
    );

    // Click the "Mes" toggle button
    await page.getByRole('button', { name: 'Mes' }).click();
    await page.waitForResponse(
      (r) => r.url().includes('group_by=month') && r.status() === 200,
      { timeout: 10000 }
    );

    // Verify the new chart section headers are present
    await expect(page.getByText('Ingresos en el tiempo')).toBeVisible();
    await expect(page.getByText('Unidades lavadas por servicio')).toBeVisible();
    await expect(page.getByText('Desglose por servicio')).toBeVisible();

    expect(errors).toHaveLength(0);
  });
});
