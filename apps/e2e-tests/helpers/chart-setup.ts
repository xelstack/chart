import { Page } from '@playwright/test';

/**
 * E2E 테스트용 헬퍼 함수
 * Vite 개발 서버를 통해 실제 HTML 페이지를 로드하고 기본 차트를 초기화합니다.
 */
export async function setupChartTest(page: Page): Promise<void> {
  // baseURL을 사용하여 상대 경로로 접근 (webServer가 자동으로 서버를 시작함)
  await page.goto('/');

  // 스크립트가 로드될 때까지 대기
  await page.waitForLoadState('networkidle');

  // createChart 함수가 로드될 때까지 대기
  await page.waitForFunction(
    () => {
      return typeof (window as { createChart?: unknown }).createChart === 'function';
    },
    { timeout: 10000 }
  );
}

/**
 * 동적으로 차트를 생성하는 헬퍼 함수
 */
export async function createChartInPage(
  page: Page,
  containerId: string,
  dataset: { points: Array<{ x: number; y: number }> },
  config: { type: string; width: number; height: number; [key: string]: unknown }
): Promise<void> {
  await page.evaluate(
    ({ containerId, dataset, config }) => {
      const container = document.getElementById(containerId);
      if (
        container !== null &&
        typeof (window as { createChart?: unknown }).createChart === 'function'
      ) {
        const win = window as unknown as {
          createChart: (
            container: HTMLElement,
            dataset: { points: Array<{ x: number; y: number }> },
            config: { type: string; width: number; height: number; [key: string]: unknown }
          ) => unknown;
        };
        (window as { chart?: unknown }).chart = win.createChart(container, dataset, config);
      }
    },
    { containerId, dataset, config }
  );

  // 차트가 초기화될 때까지 대기
  await page.waitForFunction(
    () => {
      return typeof (window as { chart?: unknown }).chart !== 'undefined';
    },
    { timeout: 10000 }
  );
}
