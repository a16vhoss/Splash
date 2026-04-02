import { test, expect } from '@playwright/test';

test('landing page loads with hero and search', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Encuentra y agenda tu autolavado en segundos')).toBeVisible();
  await expect(page.getByPlaceholder('Buscar por nombre o zona...')).toBeVisible();
});

test('search from landing navigates to autolavados with query', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Buscar por nombre o zona...').fill('test');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForURL(/\/autolavados\?q=test/);
  await expect(page).toHaveURL(/\/autolavados\?q=test/);
});

test('protected route redirects to login without auth', async ({ page }) => {
  await page.goto('/perfil');
  await page.waitForURL('/login');
  await expect(page).toHaveURL('/login');
});
