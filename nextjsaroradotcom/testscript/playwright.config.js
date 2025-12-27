import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'https://api31.winds-os.com',
    headless: true,
    ignoreHTTPSErrors: false, // We want to catch SSL errors
  },
  reporter: [['list']],
});
