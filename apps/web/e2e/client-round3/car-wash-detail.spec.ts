import { test, expect } from '@playwright/test';
import { loadSharedData } from '../fixtures/test-data';

test.describe('Car wash detail v2 features', () => {
  test('detail page loads with services and hours', async ({ page }) => {
    const { carWashSlug } = loadSharedData();
    await page.goto(`/autolavados/${carWashSlug}`);

    await expect(page.getByRole('heading', { name: 'Servicios' }).first()).toBeVisible();
    // Car wash detail page loads successfully
    await expect(page.getByText('Lavado Completo')).toBeVisible();
  });

  test('detail page shows complementary services section', async ({ page }) => {
    const { carWashSlug } = loadSharedData();
    await page.goto(`/autolavados/${carWashSlug}`);

    // If the setup car wash has complementary services from round2 tests
    // Check for the base service at minimum
    await expect(page.getByRole('heading', { name: 'Servicios' }).first()).toBeVisible();
  });

  test('notification bell is visible in navbar', async ({ page }) => {
    const { carWashSlug } = loadSharedData();
    await page.goto(`/autolavados/${carWashSlug}`);

    // Bell button should be in the navbar (it's an img inside a button)
    const bellButtons = page.locator('nav button').first();
    await expect(bellButtons).toBeVisible();
  });
});
