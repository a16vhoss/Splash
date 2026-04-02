import { test, expect } from '@playwright/test';
import { loadSharedData } from '../fixtures/test-data';

test('rate completed appointment', async ({ page }) => {
  await page.goto('/mis-citas');
  await page.waitForTimeout(2000);

  const calificarBtn = page.getByRole('link', { name: 'Calificar servicio' }).first();
  await expect(calificarBtn).toBeVisible({ timeout: 5000 });
  await calificarBtn.click();

  await expect(page.getByText('Califica tu experiencia')).toBeVisible();

  // Click on stars — try multiple selector strategies
  const starButtons = page.locator('button').filter({ hasText: '★' });
  const starCount = await starButtons.count();

  if (starCount >= 5) {
    await starButtons.nth(4).click(); // 5th star
  } else {
    const starSpans = page.locator('span').filter({ hasText: '★' });
    if (await starSpans.count() >= 5) {
      await starSpans.nth(4).click();
    }
  }

  await page.getByPlaceholder('Cuenta como fue tu experiencia...').fill('Excelente servicio, muy recomendado!');

  await page.getByRole('button', { name: 'Enviar calificacion' }).click();
  await page.waitForURL('/mis-citas', { timeout: 10_000 });
});

test('review appears on car wash detail page', async ({ page }) => {
  const { carWashSlug } = loadSharedData();
  await page.goto(`/autolavados/${carWashSlug}`);

  await expect(page.getByRole('heading', { name: 'Resenas' })).toBeVisible();
  await expect(page.getByText('Excelente servicio, muy recomendado!')).toBeVisible();
});
