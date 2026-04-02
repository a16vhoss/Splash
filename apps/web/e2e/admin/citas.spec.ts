import { test, expect } from '@playwright/test';

test('admin citas shows empty state', async ({ page }) => {
  await page.goto('/admin/citas');
  await expect(page.locator('h2', { hasText: 'Citas' })).toBeVisible();
  await expect(page.getByText('No hay citas')).toBeVisible();
});
