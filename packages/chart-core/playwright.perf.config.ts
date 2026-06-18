import { defineConfig, devices } from '@playwright/test';

const isCi = process.env.CI !== undefined && process.env.CI !== '';

export default defineConfig({
  testDir: './tests/performance',
  testMatch: '**/*.bench.ts',
  fullyParallel: false,
  forbidOnly: isCi,
  retries: 0,
  timeout: 180_000,
  reporter: [['line']],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command:
      'pnpm exec vite --config vite.perf.config.ts --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174/src/index.ts',
    reuseExistingServer: !isCi,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
