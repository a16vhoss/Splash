import { test, expect } from '@playwright/test';
import { loadSharedData } from '../fixtures/test-data';

test.describe.serial('Client booking flow', () => {
  test('car wash detail page shows services', async ({ page }) => {
    const { carWashSlug } = loadSharedData();
    expect(carWashSlug).toBeTruthy();

    await page.goto(`/autolavados/${carWashSlug}`);
    await expect(page.getByText('Servicios')).toBeVisible();
    await expect(page.getByText('Lavado Completo')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar' })).toBeVisible();
  });

  test('booking flow — select service, see date and time slots', async ({ page }) => {
    const { carWashSlug } = loadSharedData();
    await page.goto(`/autolavados/${carWashSlug}`);

    await page.getByRole('link', { name: 'Agendar' }).first().click();
    await expect(page.getByText('Agendar cita')).toBeVisible();
    await expect(page.getByText('Lavado Completo')).toBeVisible();
    await expect(page.getByText('Selecciona fecha y hora')).toBeVisible();

    // Date buttons have format "Jue\n2", "Vie\n3" etc.
    // Wait for time slots to load
    await page.waitForTimeout(2000);

    // Verify time slot buttons appear (format: "09:00", "09:30" etc.)
    await expect(page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()).toBeVisible({ timeout: 5000 });
  });

  test('complete a booking successfully', async ({ page }) => {
    const { carWashSlug } = loadSharedData();
    await page.goto(`/autolavados/${carWashSlug}`);

    await page.getByRole('link', { name: 'Agendar' }).first().click();
    await expect(page.getByText('Agendar cita')).toBeVisible();
    await page.waitForTimeout(2000);

    // Select tomorrow (2nd date button) to ensure cancellation window works
    const dateButtons = page.locator('button').filter({ hasText: /Lun|Mar|Mie|Jue|Vie|Sab|Dom/ });
    if (await dateButtons.count() > 1) {
      await dateButtons.nth(1).click();
      await page.waitForTimeout(1500);
    }

    // Click on the first available time slot
    const timeSlots = page.getByRole('button', { name: /^\d{2}:\d{2}$/ });
    await expect(timeSlots.first()).toBeVisible({ timeout: 5000 });
    await timeSlots.first().click();

    // The "Confirmar HH:MM" button should appear
    await expect(page.getByRole('button', { name: /Confirmar \d{2}:\d{2}/ })).toBeVisible();
    await page.getByRole('button', { name: /Confirmar/ }).click();

    // Should redirect to mis-citas with success message
    await page.waitForURL(/\/mis-citas/, { timeout: 10_000 });
    await expect(page.getByText('Cita agendada exitosamente')).toBeVisible();
  });
});
