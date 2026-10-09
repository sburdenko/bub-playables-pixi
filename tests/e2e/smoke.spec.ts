import { expect, test } from '@playwright/test';
import sharp from 'sharp';

const MIN_PIXEL_DEVIATION = 10;
const REFERENCE_ASPECT = 1125 / 2436;
const REFERENCE_HALF_HEIGHT = 8.2;
const CAMERA_Y = 1;
const SLING_HEIGHT_FROM_BOTTOM = 700 / 2436;

/** Where the sling anchor is on screen, from the same viewport rules the game uses. */
function slingAnchorOnScreen(width: number, height: number): { x: number; y: number } {
  const aspect = width <= height ? width / height : REFERENCE_ASPECT;
  const halfHeight = Math.max(REFERENCE_HALF_HEIGHT, (REFERENCE_HALF_HEIGHT * REFERENCE_ASPECT) / aspect);
  const pixelsPerUnit = height / (halfHeight * 2);
  const anchorY = CAMERA_Y - halfHeight + halfHeight * 2 * SLING_HEIGHT_FROM_BOTTOM;

  return { x: width / 2, y: (CAMERA_Y + halfHeight - anchorY) * pixelsPerUnit };
}

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

test('relayouts on rotation and resize without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');

  for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(100);
  }

  expect(errors).toEqual([]);
});

test('pulling and releasing the sling shoots without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
  const viewport = page.viewportSize();
  if (viewport === null) {
    throw new Error('Viewport size is unknown.');
  }

  const anchor = slingAnchorOnScreen(viewport.width, viewport.height);
  const before = await page.screenshot();
  await page.mouse.move(anchor.x, anchor.y);
  await page.mouse.down();
  await page.mouse.move(anchor.x - 10, anchor.y + 30, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(1500);

  expect(Buffer.compare(before, await page.screenshot())).not.toBe(0);
  expect(errors).toEqual([]);
});

test('a matching shot plays the attack without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?seed=1');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
  const viewport = page.viewportSize();
  if (viewport === null) {
    throw new Error('Viewport size is unknown.');
  }

  const anchor = slingAnchorOnScreen(viewport.width, viewport.height);
  const board = { x: 0, y: 0, width: viewport.width, height: anchor.y * 0.7 };
  const before = await page.screenshot({ clip: board });
  await page.mouse.move(anchor.x, anchor.y);
  await page.mouse.down();
  await page.mouse.move(anchor.x, anchor.y + 40, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(3500);

  expect(Buffer.compare(before, await page.screenshot({ clip: board }))).not.toBe(0);
  expect(errors).toEqual([]);
});

test('after the first attack the end card dims the game and a tap opens the store', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => message.type() === 'warning' && warnings.push(message.text()));
  await page.goto('/?seed=1');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
  const viewport = page.viewportSize();
  if (viewport === null) {
    throw new Error('Viewport size is unknown.');
  }

  const anchor = slingAnchorOnScreen(viewport.width, viewport.height);
  const brightness = async () => (await sharp(await page.screenshot()).stats()).channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0);
  const before = await brightness();
  await page.mouse.move(anchor.x, anchor.y);
  await page.mouse.down();
  await page.mouse.move(anchor.x, anchor.y + 40, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(6000);

  expect(await brightness()).toBeLessThan(before * 0.7);
  await page.mouse.click(viewport.width / 2, viewport.height / 2);
  await expect.poll(() => warnings.some((text) => text.includes('No store URL'))).toBe(true);
});
