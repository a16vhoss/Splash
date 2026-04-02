import { test, expect } from '@playwright/test';
import { TEST_ADMIN } from '../fixtures/test-data';

test.describe.serial('Client booking flow', () => {
  test('car wash detail page shows services', async ({ page }) => {
    await page.goto('/autolavados');
    await page.getByPlaceholder('Buscar...').fill(TEST_ADMIN.nombreNegocio);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.waitForTimeout(1500);

    const washCard = page.getByText(TEST_ADMIN.nombreNegocio);
    if (!(await washCard.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Car wash not verified — cannot find in listing');
      return;
    }

    await washCard.click();
    await expect(page.getByText('Servicios')).toBeVisible();
    await expect(page.getByText('Lavado Completo')).toBeVisible();
  });

  test('booking flow — select service, see slots', async ({ page }) => {
    await page.goto('/autolavados');
    await page.getByPlaceholder('Buscar...').fill(TEST_ADMIN.nombreNegocio);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.waitForTimeout(1500);

    const washCard = page.getByText(TEST_ADMIN.nombreNegocio);
    if (!(await washCard.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Car wash not verified — cannot find in listing');
      return;
    }

    await washCard.click();
    await page.getByRole('link', { name: /Agendar/i }).first().click();
    await expect(page.getByText('Agendar cita')).toBeVisible();
    await expect(page.getByText('Lavado Completo')).toBeVisible();

    await page.waitForTimeout(2000);
    const dateButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    const count = await dateButtons.count();
    expect(count).toBeGreaterThan(0);

    if (count > 1) {
      await dateButtons.nth(1).click();
    }
    await page.waitForTimeout(2000);

    const slotsOrMessage = page.locator('.grid button').or(page.getByText('Cerrado este dia')).or(page.getByText('No hay horarios'));
    await expect(slotsOrMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('complete a booking successfully', async ({ page }) => {
    await page.goto('/autolavados');
    await page.getByPlaceholder('Buscar...').fill(TEST_ADMIN.nombreNegocio);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.waitForTimeout(1500);

    const washCard = page.getByText(TEST_ADMIN.nombreNegocio);
    if (!(await washCard.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Car wash not verified — cannot find in listing');
      return;
    }

    await washCard.click();
    await page.getByRole('link', { name: /Agendar/i }).first().click();
    await expect(page.getByText('Agendar cita')).toBeVisible();
    await page.waitForTimeout(2000);

    const dateButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    let foundSlot = false;

    for (let i = 0; i < await dateButtons.count() && !foundSlot; i++) {
      await dateButtons.nth(i).click();
      await page.waitForTimeout(1500);

      const availableSlots = page.locator('.grid button:not([disabled])');
      if (await availableSlots.count() > 0) {
        await availableSlots.first().click();
        foundSlot = true;
      }
    }

    expect(foundSlot).toBe(true);

    await page.getByRole('button', { name: /Confirmar/ }).click();
    await page.waitForURL(/\/mis-citas/, { timeout: 10_000 });
    await expect(page.getByText('Cita agendada exitosamente')).toBeVisible();
  });
});
