import { test, expect } from '@playwright/test';

test('autolavados listing page loads', async ({ page }) => {
  await page.goto('/autolavados');
  await expect(page.getByText('Todos los autolavados')).toBeVisible();
});

test('search filters results', async ({ page }) => {
  await page.goto('/autolavados');
  await page.getByPlaceholder('Buscar...').fill('nonexistent-xyz-999');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText('No se encontraron autolavados')).toBeVisible();
});
