import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
  },
  projects: [
    { name: 'phone-portrait', use: { ...devices['Pixel 7'], channel: 'chrome' } },
    { name: 'tablet-landscape', use: { viewport: { width: 1024, height: 768 }, hasTouch: true } },
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: true,
  },
});
