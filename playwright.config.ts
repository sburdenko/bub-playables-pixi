import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const IS_CI = Boolean(process.env.CI);
/** CI runners have no GPU: WebGL is software-rendered, so one worker and a 1x canvas keep the page responsive. */
const CI_PHONE_SCALE = IS_CI ? { deviceScaleFactor: 1 } : {};
const CI_RUNNER = IS_CI ? { workers: 1, retries: 1 } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: !IS_CI,
  ...CI_RUNNER,
  forbidOnly: IS_CI,
  reporter: IS_CI ? [['github'], ['list']] : [['list']],
  use: {
    trace: 'retain-on-failure',
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
  },
  projects: [
    { name: 'phone-portrait', use: { ...devices['Pixel 7'], ...CI_PHONE_SCALE, channel: 'chrome' } },
    { name: 'tablet-landscape', use: { viewport: { width: 1024, height: 768 }, hasTouch: true } },
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: true,
  },
});
