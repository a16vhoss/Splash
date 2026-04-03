import { test, expect } from '@playwright/test';

test.describe.serial('Admin configuracion (v2 features)', () => {
  test('configuracion page loads with payment methods', async ({ page }) => {
    await page.goto('/admin/configuracion');
    await expect(page.getByRole('heading', { name: 'Configuracion' })).toBeVisible();
    await expect(page.getByText('Metodos de pago aceptados')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Efectivo' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Tarjeta en sitio' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Transferencia bancaria' })).toBeVisible();
    await expect(page.getByText('WhatsApp')).toBeVisible();
    await expect(page.getByText('Ubicacion')).toBeVisible();
  });

  test('save payment methods and WhatsApp', async ({ page }) => {
    await page.goto('/admin/configuracion');

    // Enable tarjeta
    const tarjetaCheckbox = page.getByRole('checkbox', { name: 'Tarjeta en sitio' });
    if (!(await tarjetaCheckbox.isChecked())) {
      await tarjetaCheckbox.check();
    }

    // Set WhatsApp number
    await page.getByRole('textbox').first().fill('5213312345678');

    // Save
    await page.getByRole('button', { name: 'Guardar configuracion' }).click();
    await page.waitForTimeout(2000);

    // Verify persistence
    await page.reload();
    await expect(page.getByRole('checkbox', { name: 'Efectivo' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Tarjeta en sitio' })).toBeChecked();
  });

  test('create service with descripcion and categoria', async ({ page }) => {
    await page.goto('/admin/servicios');

    await page.getByPlaceholder('Lavado basico').fill('Lavado Express V2');
    await page.getByPlaceholder('150.00').fill('100');
    await page.getByPlaceholder('30').fill('25');
    await page.getByRole('combobox').selectOption('Detailing');
    await page.getByPlaceholder('Describe el servicio...').fill('Servicio rapido de detailing');

    await page.getByRole('button', { name: 'Agregar servicio' }).click();
    await page.waitForTimeout(2000);
    await page.reload();

    await expect(page.getByText('Lavado Express V2')).toBeVisible();
    await expect(page.getByText('Servicio rapido de detailing')).toBeVisible();
  });

  test('create complementary service', async ({ page }) => {
    await page.goto('/admin/servicios');

    await page.getByPlaceholder('Lavado basico').fill('Aromatizante');
    await page.getByPlaceholder('150.00').fill('30');
    await page.getByPlaceholder('30').fill('15');
    await page.getByPlaceholder('Describe el servicio...').fill('Aroma premium para tu vehiculo');
    await page.getByRole('checkbox', { name: 'Es complementario (add-on)' }).check();

    await page.getByRole('button', { name: 'Agregar servicio' }).click();
    await page.waitForTimeout(2000);
    await page.reload();

    // Complementary section should appear
    await expect(page.getByText('Servicios complementarios')).toBeVisible();
    await expect(page.getByText('Aromatizante')).toBeVisible();
  });

  test('toast appears on save horarios', async ({ page }) => {
    await page.goto('/admin/servicios');

    // Set Monday hours
    await page.locator('input[name="apertura_1"]').fill('08:00');
    await page.locator('input[name="cierre_1"]').fill('20:00');

    await page.getByRole('button', { name: 'Guardar horarios' }).click();

    // Toast should appear
    await expect(page.getByText('Horarios guardados correctamente')).toBeVisible({ timeout: 5000 });
  });

  test('sidebar shows Configuracion link', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('link', { name: 'Configuracion' })).toBeVisible();
  });
});
