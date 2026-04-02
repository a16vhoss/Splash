import { test, expect } from '@playwright/test';
import { TEST_CLIENT } from '../fixtures/test-data';

test('profile shows user data', async ({ page }) => {
  await page.goto('/perfil');
  await page.waitForTimeout(2000);

  await expect(page.getByText('Mi Perfil')).toBeVisible();
  await expect(page.getByText(TEST_CLIENT.nombre)).toBeVisible();
  await expect(page.getByText(TEST_CLIENT.email)).toBeVisible();
});

test('logout redirects to home', async ({ page }) => {
  await page.goto('/perfil');
  await page.waitForTimeout(2000);

  await page.getByRole('button', { name: 'Cerrar sesion' }).click();
  await page.waitForURL('/', { timeout: 10_000 });

  await page.goto('/perfil');
  await page.waitForURL('/login', { timeout: 5000 });
});
