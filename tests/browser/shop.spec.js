import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#healthy')).toHaveText('4/4');
});
test('catalog search, basket quantities, delivery and demo checkout', async ({ page }) => {
  const catalog = page.frameLocator('iframe[title="Product catalog"]');
  const basket = page.frameLocator('iframe[title="Shopping basket"]');
  await catalog.getByLabel('Search products').fill('notebook');
  await expect(catalog.locator('.product')).toHaveCount(1);
  await catalog.getByRole('button', { name: 'Add to basket' }).click();
  await expect(basket.locator('.grand strong')).toHaveText('€18.00');
  await basket.getByRole('button', { name: 'Add Everyday notebook' }).click();
  await expect(basket.locator('.grand strong')).toHaveText('€36.00');
  await page.frameLocator('iframe[title="Delivery options"]').getByLabel('Express delivery').check();
  await expect(basket.locator('.grand strong')).toHaveText('€41.00');
  await basket.getByRole('button', { name: 'Place demo order' }).click();
  await expect(basket.getByRole('status')).toContainText('Nothing has been charged');
  await expect(basket.locator('.grand strong')).toHaveText('€0.00');
});
for (const name of ['react', 'vue', 'svelte', 'qwik']) {
  test(`${name} fails independently and recovers with shared state`, async ({ page }) => {
    await page.frameLocator('iframe[title="Product catalog"]').getByRole('button', { name: 'Add to basket' }).first().click();
    const control = page.locator(`[data-control="${name}"]`);
    await control.getByRole('button', { name: 'Fail app' }).click();
    await expect(page.locator(`[data-app="${name}"] .failure`)).toBeVisible();
    await expect(page.locator('#healthy')).toHaveText('3/4');
    const other = name === 'react' ? 'svelte' : 'react';
    const otherControl = page.locator(`[data-control="${other}"]`);
    const previous = Number(await otherControl.locator('.count').textContent());
    await otherControl.getByRole('button', { name: 'Render', exact: true }).click();
    await expect.poll(async () => Number(await otherControl.locator('.count').textContent())).toBeGreaterThan(previous);
    await control.getByRole('button', { name: 'Restart', exact: true }).click();
    await expect(page.locator('#healthy')).toHaveText('4/4');
    await expect(page.frameLocator('iframe[title="Shopping basket"]').locator('.grand strong')).toHaveText('€18.00');
  });
}
test('Qwik recommendation updates and adds the selected product', async ({ page }) => {
  const pick = page.frameLocator('iframe[title="Product recommendation"]');
  await pick.getByRole('button', { name: 'Next product' }).click();
  await expect(pick.getByRole('heading', { name: 'Arc desk lamp' })).toBeVisible();
  await pick.getByRole('button', { name: 'Add for' }).click();
  await expect(page.frameLocator('iframe[title="Shopping basket"]').locator('.grand strong')).toHaveText('€64.00');
});
test('mobile layout and admin visibility', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Hide admin panel' }).click();
  await expect(page.locator('#admin')).toBeHidden();
  await page.getByRole('button', { name: 'Show admin panel' }).click();
  await expect(page.locator('#admin')).toBeVisible();
});
