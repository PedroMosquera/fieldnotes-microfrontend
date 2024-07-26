import { test, expect } from '@playwright/test';

test('Qwik completes its handshake while below the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('/');
  const bounds = await page.locator('[data-app="qwik"]').boundingBox();
  expect(bounds.y).toBeGreaterThan(500);
  await expect(page.locator('#healthy')).toHaveText('4/4', { timeout: 10000 });
  await expect(page.locator('[data-control="qwik"] .app-status')).toHaveAttribute('data-status', 'healthy');
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
