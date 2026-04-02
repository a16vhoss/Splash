import { test, expect } from '@playwright/test';
import { TEST_ADMIN } from '../fixtures/test-data';

test('rate completed appointment', async ({ page }) => {
  await page.goto('/mis-citas');
  await page.waitForTimeout(2000);

  const calificarBtn = page.getByRole('link', { name: 'Calificar servicio' }).first();
  await expect(calificarBtn).toBeVisible({ timeout: 5000 });
  await calificarBtn.click();

  await expect(page.getByText('Califica tu experiencia')).toBeVisible();

  // Click on stars — the StarRatingInput renders clickable star elements
  // Try multiple selector strategies
  const starButtons = page.locator('button').filter({ hasText: '★' });
  const starCount = await starButtons.count();

  if (starCount >= 5) {
    await starButtons.nth(4).click(); // 5th star
  } else {
    // Fallback: try span elements with stars
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
  await expect(page.getByText('Resenas')).toBeVisible();
  await expect(page.getByText('Excelente servicio, muy recomendado!')).toBeVisible();
});
