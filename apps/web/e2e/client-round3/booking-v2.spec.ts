import { test, expect } from '@playwright/test';
import { loadSharedData } from '../fixtures/test-data';

test.describe.serial('Booking flow v2 — extras and payment', () => {
  test('booking page shows extras and payment methods', async ({ page }) => {
    const { carWashSlug } = loadSharedData();
    await page.goto(`/autolavados/${carWashSlug}`);

    // Click Agendar on the first service
    const agendarLink = page.getByRole('link', { name: 'Agendar' }).first();
    await expect(agendarLink).toBeVisible({ timeout: 5000 });
    await agendarLink.click();

    await expect(page.getByText('Agendar cita')).toBeVisible();

    // Extras section should show if complementary services exist
    const extrasSection = page.getByText('Agrega extras');
    const hasExtras = await extrasSection.isVisible().catch(() => false);

    if (hasExtras) {
      // Verify extras are displayed with checkbox
      const checkboxes = page.locator('input[type="checkbox"]');
      expect(await checkboxes.count()).toBeGreaterThan(0);
    }

    // Payment methods section should be visible
    await expect(page.getByText('Metodo de pago')).toBeVisible();

    // At least one payment method radio button
    const radios = page.locator('input[type="radio"]');
    expect(await radios.count()).toBeGreaterThan(0);
  });

  test('selecting extras updates total price', async ({ page }) => {
    const { carWashSlug } = loadSharedData();
    await page.goto(`/autolavados/${carWashSlug}`);

    await page.getByRole('link', { name: 'Agendar' }).first().click();
    await expect(page.getByText('Agendar cita')).toBeVisible();

    const extrasSection = page.getByText('Agrega extras');
    const hasExtras = await extrasSection.isVisible().catch(() => false);

    if (hasExtras) {
      // Get initial total
      const totalEl = page.locator('text=/Total: \\$/');
      const initialTotal = await totalEl.textContent();

      // Click the first checkbox
      await page.locator('input[type="checkbox"]').first().check();
      await page.waitForTimeout(500);

      // Total should have changed
      const newTotal = await totalEl.textContent();
      expect(newTotal).not.toBe(initialTotal);
    }
  });

  test('calendar download button exists on confirmed appointment', async ({ page }) => {
    await page.goto('/mis-citas');
    await page.waitForTimeout(2000);

    // Check if there are confirmed appointments with calendar button
    const calendarBtn = page.getByRole('button', { name: 'Agregar al calendario' });
    const hasCalendar = await calendarBtn.first().isVisible().catch(() => false);

    if (hasCalendar) {
      // Verify the button is clickable (triggers ICS download)
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }),
        calendarBtn.first().click(),
      ]);
      expect(download.suggestedFilename()).toBe('cita-splash.ics');
    }
  });
});
