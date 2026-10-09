import { expect, test } from '@playwright/test';
import sharp from 'sharp';

const MIN_PIXEL_DEVIATION = 10;

test('production build starts without errors and fills the screen', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');

  const canvas = page.locator('#app canvas');
  const viewport = page.viewportSize();
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box?.width).toBe(viewport?.width);
  expect(box?.height).toBe(viewport?.height);
  expect(errors).toEqual([]);
});

test('scene is actually drawn, not a blank canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');

  const { channels } = await sharp(await page.screenshot()).stats();

  expect(Math.max(...channels.slice(0, 3).map((channel) => channel.stdev))).toBeGreaterThan(MIN_PIXEL_DEVIATION);
});

test('build is self-contained: no network requests besides the page', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');

  const external = requests.filter((url) => !url.startsWith('data:') && !url.startsWith('blob:') && !url.endsWith('/'));
  expect(external).toEqual([]);
});
