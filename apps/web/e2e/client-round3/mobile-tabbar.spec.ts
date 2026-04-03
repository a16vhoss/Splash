import { test, expect } from '@playwright/test';

test.describe('Client mobile tab bar', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('bottom tab bar is visible on mobile', async ({ page }) => {
    await page.goto('/mis-citas');

    await expect(page.getByText('Inicio').last()).toBeVisible();
    await expect(page.getByText('Agendar').last()).toBeVisible();
    await expect(page.getByText('Mis Citas').last()).toBeVisible();
    await expect(page.getByText('Cuenta').last()).toBeVisible();
  });

  test('tab navigation works', async ({ page }) => {
    await page.goto('/mis-citas');

    await page.getByRole('link', { name: 'Cuenta' }).last().click();
    await page.waitForURL('/perfil');
    await expect(page).toHaveURL('/perfil');

    await page.getByRole('link', { name: 'Inicio' }).last().click();
    await page.waitForURL('/autolavados');
    await expect(page).toHaveURL('/autolavados');
  });

  test('footer is hidden on mobile', async ({ page }) => {
    await page.goto('/mis-citas');
    await expect(page.getByText('© 2026 Splash')).not.toBeVisible();
  });
});
