import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#healthy')).toHaveText('4/4');
});
test('favorites flow from Qwik into the React saved collection', async ({ page }) => {
  const pick = page.frameLocator('iframe[title="Product recommendation"]');
  const catalog = page.frameLocator('iframe[title="Product catalog"]');
  await pick.getByRole('button', { name: 'Save product' }).click();
  await catalog.getByLabel('Saved only').check();
  await expect(catalog.locator('.product')).toHaveCount(1);
  await expect(catalog.locator('.product h2')).toHaveText('Everyday notebook');
});
test('Svelte propagates theme tokens to all framework roots', async ({ page }) => {
  await page.frameLocator('iframe[title="Delivery options"]').getByLabel('Color theme').selectOption('ocean');
  for (const title of ['Product catalog', 'Shopping basket', 'Delivery options', 'Product recommendation']) {
    await expect(page.frameLocator(`iframe[title="${title}"]`).locator('html')).toHaveAttribute('data-theme', 'ocean');
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean');
});
test('paused basket catches up when transport resumes', async ({ page }) => {
  const basket = page.frameLocator('iframe[title="Shopping basket"]');
  await expect(basket.locator('.grand strong')).toHaveText('€0.00');
  await page.getByLabel('vue state delivery', { exact: true }).selectOption('pause');
  await page.frameLocator('iframe[title="Product catalog"]').getByRole('button', { name: 'Add to basket' }).first().click();
  await expect(page.locator('#lab-state pre')).toContainText('"notebook": 1');
  await expect(basket.locator('.grand strong')).toHaveText('€0.00');
  await page.getByLabel('vue state delivery', { exact: true }).selectOption('normal');
  await expect(basket.locator('.grand strong')).toHaveText('€18.00');
});
test('duplicated domain command changes basket exactly once', async ({ page }) => {
  await page.locator('[data-control="react"] summary').click();
  await page.locator('[data-control="react"]').getByRole('button', { name: 'Duplicate next command' }).click();
  await page.frameLocator('iframe[title="Product catalog"]').getByRole('button', { name: 'Add to basket' }).first().click();
  await expect(page.frameLocator('iframe[title="Shopping basket"]').locator('.quantity span')).toHaveText('1');
  await expect(page.locator('#activity')).toContainText('command already handled');
});
test('contract probes reject protocol and ownership violations', async ({ page }) => {
  await page.locator('.training > summary').click();
  await page.getByRole('button', { name: 'Exercises', exact: true }).click();
  await page.getByRole('button', { name: 'Probe wrong protocol' }).click();
  await page.getByRole('button', { name: 'Probe wrong permission' }).click();
  await expect.poll(() => page.locator('#activity li').filter({ hasText: 'mismatch' }).count()).toBe(2);
  await expect(page.frameLocator('iframe[title="Shopping basket"]').locator('.grand strong')).toHaveText('€0.00');
});
test('basket and preferences survive a full reload', async ({ page }) => {
  await page.frameLocator('iframe[title="Product catalog"]').getByRole('button', { name: 'Add to basket' }).first().click();
  await expect(page.frameLocator('iframe[title="Shopping basket"]').locator('.grand strong')).toHaveText('€18.00');
  await page.reload();
  await expect(page.locator('#healthy')).toHaveText('4/4');
  await expect(page.frameLocator('iframe[title="Shopping basket"]').locator('.grand strong')).toHaveText('€18.00');
});
