import { test, expect } from '@playwright/test';
import { TEST_CLIENT, CLIENT_STATE } from '../fixtures/test-data';

test('re-login client after logout in round2', async ({ page }) => {
  // Clear any existing cookies first
  await page.context().clearCookies();

  await page.goto('/login');

  // Fill login form
  await page.getByLabel('Email').fill(TEST_CLIENT.email);
  await page.getByLabel('Password').fill(TEST_CLIENT.password);
  await page.getByRole('button', { name: 'INGRESAR' }).click();

  // Wait for any post-login redirect to settle
  await page.waitForTimeout(5000);
  // Navigate to home to confirm session works
  await page.goto('/');
  await expect(page.getByText('Encuentra y agenda')).toBeVisible({ timeout: 5000 });

  // Save fresh auth state
  await page.context().storageState({ path: CLIENT_STATE });
});
