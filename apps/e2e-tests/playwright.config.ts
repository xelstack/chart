import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */

// devices 객체를 변수로 분리하여 타입 추론 활용 (헌법: 타입 추론 우선)
const desktopChrome = devices['Desktop Chrome'];
const desktopFirefox = devices['Desktop Firefox'];
const desktopSafari = devices['Desktop Safari'];

const config: PlaywrightTestConfig = {
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: process.env.CI !== undefined && process.env.CI !== '',
  retries: process.env.CI !== undefined && process.env.CI !== '' ? 2 : 0,
  workers: process.env.CI !== undefined && process.env.CI !== '' ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...desktopChrome },
    },
    {
      name: 'firefox',
      use: { ...desktopFirefox },
    },
    {
      name: 'webkit',
      use: { ...desktopSafari },
    },
  ],

  webServer: {
    command: 'pnpm --filter @chart/demo dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !(process.env.CI !== undefined && process.env.CI !== ''),
    timeout: 120 * 1000, // 120초 타임아웃
    stdout: 'pipe', // stdout 출력 확인 (디버깅용)
    stderr: 'pipe', // stderr는 파이프로 전달
    cwd: '../../', // 프로젝트 루트에서 실행
  },
};

export default defineConfig(config);
