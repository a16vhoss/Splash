import { test, expect } from '@playwright/test';
import { TEST_ADMIN, TEST_CLIENT, ADMIN_STATE, CLIENT_STATE, saveSharedData } from './fixtures/test-data';

test('register wash_admin and save auth state', async ({ page }) => {
  await page.goto('/login');

  // Switch to "Registrar negocio" tab
  await page.getByRole('button', { name: 'Registrar negocio' }).click();

  // Fill registration form
  await page.getByLabel('Tu nombre').fill(TEST_ADMIN.nombre);
  await page.getByLabel('Nombre del autolavado').fill(TEST_ADMIN.nombreNegocio);
  await page.getByLabel('Direccion del negocio').fill(TEST_ADMIN.direccion);
  await page.getByLabel('Email').fill(TEST_ADMIN.email);
  await page.getByLabel('Password').fill(TEST_ADMIN.password);

  // Submit
  await page.getByRole('button', { name: 'REGISTRAR MI NEGOCIO' }).click();

  // Wait for redirect to admin dashboard
  await page.waitForURL('/admin/dashboard', { timeout: 15_000 });

  // Fetch car wash slug and ID via API
  const carWashData = await page.evaluate(async () => {
    const res = await fetch('/api/my-car-wash');
    if (!res.ok) return null;
    return res.json();
  });

  expect(carWashData).toBeTruthy();
  saveSharedData({
    carWashId: carWashData.id,
    carWashSlug: carWashData.slug,
    carWashNombre: carWashData.nombre,
  });

  // Save auth state
  await page.context().storageState({ path: ADMIN_STATE });
});

test('register client and save auth state', async ({ page }) => {
  await page.goto('/login');

  // Switch to "Soy cliente" tab
  await page.getByRole('button', { name: 'Soy cliente' }).click();

  // Fill registration form
  await page.getByLabel('Tu nombre').fill(TEST_CLIENT.nombre);
  await page.getByLabel('Email').fill(TEST_CLIENT.email);
  await page.getByLabel('Password').fill(TEST_CLIENT.password);

  // Submit
  await page.getByRole('button', { name: 'CREAR MI CUENTA' }).click();

  // Wait for redirect to home
  await page.waitForURL('/', { timeout: 15_000 });

  // Save auth state
  await page.context().storageState({ path: CLIENT_STATE });
});
