import { test, expect } from '@playwright/test';
import { TEST_ADMIN } from '../fixtures/test-data';

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

    page.on('dialog', async (dialog) => {
      await dialog.accept('Ya no puedo asistir');
    });

    await page.getByRole('button', { name: 'Cancelar cita' }).first().click();
    await page.waitForTimeout(2000);
    await expect(page.getByText('Cancelada')).toBeVisible();
  });

  test('create second appointment for rating flow', async ({ page }) => {
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
