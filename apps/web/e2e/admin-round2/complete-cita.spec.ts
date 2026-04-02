import { test, expect } from '@playwright/test';

test('admin marks appointment as completed', async ({ page }) => {
  await page.goto('/admin/citas');
  await expect(page.getByText('Citas')).toBeVisible();

  // Filter to confirmed appointments
  await page.getByRole('link', { name: 'Confirmadas' }).click();
  await page.waitForTimeout(1500);

  // There should be at least one confirmed appointment (the second booking)
  const completarBtn = page.getByRole('button', { name: 'Completar' }).first();
  await expect(completarBtn).toBeVisible({ timeout: 5000 });

  // Click Completar
  await completarBtn.click();

  // Wait for page refresh
  await page.waitForTimeout(2000);
  await page.reload();

  // Navigate to completed filter to verify
  await page.getByRole('link', { name: 'Completadas' }).click();
  await page.waitForTimeout(1500);

  // Should see at least one completed appointment
  await expect(page.getByText('Completada').first()).toBeVisible();
});
