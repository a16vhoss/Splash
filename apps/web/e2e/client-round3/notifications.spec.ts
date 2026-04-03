import { test, expect } from '@playwright/test';

test.describe('Notification center', () => {
  test('notification bell opens dropdown', async ({ page }) => {
    await page.goto('/mis-citas');
    await page.waitForTimeout(1000);

    // Find and click the notification bell (button with bell SVG, before user dropdown)
    // The bell is the first button in the nav right section
    const navButtons = page.locator('nav button');
    // Bell is typically the first button in the right side
    await navButtons.first().click();

    // Dropdown should show
    await expect(page.getByText('Notificaciones')).toBeVisible({ timeout: 3000 });
  });

  test('notification API returns data', async ({ page }) => {
    await page.goto('/mis-citas');

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/notifications');
      return { status: res.status, data: await res.json() };
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });
});
