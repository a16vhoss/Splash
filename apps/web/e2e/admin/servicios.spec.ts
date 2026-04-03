import { test, expect } from '@playwright/test';

test.describe.serial('Admin servicios', () => {
  test('configure business hours', async ({ page }) => {
    await page.goto('/admin/servicios');
    await expect(page.getByText('Horario de operacion')).toBeVisible();

    // Set Monday (index 1) through Friday (index 5): 08:00 - 20:00
    for (const i of [1, 2, 3, 4, 5]) {
      await page.locator(`input[name="apertura_${i}"]`).fill('08:00');
      await page.locator(`input[name="cierre_${i}"]`).fill('20:00');
      const cerrado = page.locator(`input[name="cerrado_${i}"]`);
      if (await cerrado.isChecked()) await cerrado.uncheck();
    }

    // Saturday (index 6): 09:00 - 15:00
    await page.locator('input[name="apertura_6"]').fill('09:00');
    await page.locator('input[name="cierre_6"]').fill('15:00');
    const satCerrado = page.locator('input[name="cerrado_6"]');
    if (await satCerrado.isChecked()) await satCerrado.uncheck();

    // Sunday (index 0): cerrado
    const sunCerrado = page.locator('input[name="cerrado_0"]');
    if (!(await sunCerrado.isChecked())) await sunCerrado.check();

    // Save
    await page.getByRole('button', { name: 'Guardar horarios' }).click();
    await page.waitForTimeout(2000);
    await page.reload();
    await expect(page.locator('input[name="apertura_1"]')).toHaveValue('08:00');
  });

  test('create a service', async ({ page }) => {
    await page.goto('/admin/servicios');
    await page.getByPlaceholder('Lavado basico').fill('Lavado Express');
    await page.getByPlaceholder('150.00').fill('75');
    await page.getByPlaceholder('30').fill('20');
    await page.getByRole('button', { name: 'Agregar servicio' }).click();
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByText('Lavado Express')).toBeVisible();
  });

  test('delete service', async ({ page }) => {
    await page.goto('/admin/servicios');
    await expect(page.getByText('Lavado Express')).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar' }).first().click();
    await page.waitForTimeout(3000);
    await page.reload();
    await expect(page.getByText('Lavado Express')).not.toBeVisible();
  });

  test('create permanent service for booking', async ({ page }) => {
    await page.goto('/admin/servicios');
    await page.getByPlaceholder('Lavado basico').fill('Lavado Completo');
    await page.getByPlaceholder('150.00').fill('150');
    await page.getByPlaceholder('30').fill('30');
    await page.getByRole('button', { name: 'Agregar servicio' }).click();
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByText('Lavado Completo')).toBeVisible();
    await expect(page.getByText('$150.00')).toBeVisible();
  });

  test('service form validates required fields', async ({ page }) => {
    await page.goto('/admin/servicios');
    const submitBtn = page.getByRole('button', { name: 'Agregar servicio' });
    await submitBtn.click();
    const nombreInput = page.getByPlaceholder('Lavado basico');
    await expect(nombreInput).toHaveAttribute('required', '');
  });
});
