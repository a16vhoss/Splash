import { test, expect } from '@playwright/test';
import { loadSharedData } from '../fixtures/test-data';

test.describe.serial('Client mis-citas', () => {
  test('appointment appears in list', async ({ page }) => {
    await page.goto('/mis-citas');
    await page.waitForTimeout(2000);
    await expect(page.getByText('Lavado Completo')).toBeVisible();
    await expect(page.getByText('Confirmada')).toBeVisible();
  });

  test('cancel appointment with reason', async ({ page }) => {
    await page.goto('/mis-citas');
    await page.waitForTimeout(2000);

    // Override window.prompt to auto-return a value (avoids dialog timing issues)
    await page.evaluate(() => {
      window.prompt = () => 'Ya no puedo asistir';
    });

    await page.getByRole('button', { name: 'Cancelar cita' }).first().click();

    // Wait for the cancel API call and re-fetch
    await page.waitForTimeout(3000);
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.getByText('Cancelada')).toBeVisible();
  });

  test('create second appointment for rating flow', async ({ page }) => {
    const { carWashSlug } = loadSharedData();
    await page.goto(`/autolavados/${carWashSlug}`);

    await page.getByRole('link', { name: 'Agendar' }).first().click();
    await expect(page.getByText('Agendar cita')).toBeVisible();
    await page.waitForTimeout(2000);

    // Select tomorrow (2nd date button)
    const dateButtons = page.locator('button').filter({ hasText: /Lun|Mar|Mie|Jue|Vie|Sab|Dom/ });
    if (await dateButtons.count() > 1) {
      await dateButtons.nth(1).click();
      await page.waitForTimeout(1500);
    }

    // Click on the first available time slot
    const timeSlots = page.getByRole('button', { name: /^\d{2}:\d{2}$/ });
    await expect(timeSlots.first()).toBeVisible({ timeout: 5000 });
    await timeSlots.first().click();

    // Confirm
    await expect(page.getByRole('button', { name: /Confirmar/ })).toBeVisible();
    await page.getByRole('button', { name: /Confirmar/ }).click();

    await page.waitForURL(/\/mis-citas/, { timeout: 10_000 });
    await expect(page.getByText('Cita agendada exitosamente')).toBeVisible();
  });
});
