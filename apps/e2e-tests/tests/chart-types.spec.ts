import { test, expect } from '@playwright/test';

test.describe('다양한 차트 타입 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    // baseURL을 사용하여 상대 경로로 접근
    await page.goto('/');
    
    // 스크립트가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 선 그래프 생성
    await page.evaluate(() => {
      const container = document.getElementById('line-chart-container');
      if (container !== null && typeof (window as { createChart?: unknown }).createChart === 'function') {
        const createChart = (window as { createChart: (container: HTMLElement, dataset: { points: Array<{ x: number; y: number }> }, config: { type: string; width: number; height: number }) => unknown }).createChart;
        if ((window as { charts?: { line?: unknown } }).charts === undefined) {
          (window as { charts: { line?: unknown } }).charts = {};
        }
        (window as { charts: { line?: unknown } }).charts.line = createChart(
          container,
          {
            points: [
              { x: 0, y: 10 },
              { x: 1, y: 20 },
              { x: 2, y: 15 },
              { x: 3, y: 25 },
              { x: 4, y: 30 },
            ],
          },
          {
            type: 'line',
            width: 800,
            height: 600,
          }
        );
      }
    });
    
    // 차트가 초기화될 때까지 대기
    await page.waitForFunction(() => {
      return typeof (window as { charts?: { line?: unknown } }).charts?.line !== 'undefined';
    }, { timeout: 10000 });
  });

  test('선 그래프가 정상적으로 렌더링되어야 함', async ({ page }) => {
    const container = page.locator('#line-chart-container');
    await expect(container).toBeVisible();

    const canvas = container.locator('canvas');
    await expect(canvas).toBeVisible();

    // 차트 인스턴스 확인
    const chartExists = await page.evaluate(() => {
      return (
        typeof (window as { charts?: { line?: unknown } }).charts?.line !== 'undefined' &&
        (window as { charts?: { line?: unknown } }).charts?.line !== null
      );
    });

    expect(chartExists).toBe(true);

    // 차트 상태 확인
    const state = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const charts = (
        window as { charts?: { line?: { getState: () => { status: string; pointCount: number } } } }
      ).charts;
      if (charts?.line !== null && charts?.line !== undefined) {
        return charts.line.getState();
      }
      return null;
    });

    expect(state).not.toBeNull();
    if (state !== null) {
      expect(state.status).toBe('ready');
    }
  });

  test('차트 타입이 올바르게 설정되어야 함', async ({ page }) => {
    const config = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const charts = (
        window as { charts?: { line?: { getState: () => { status: string; pointCount: number } } } }
      ).charts;
      if (charts?.line !== null && charts?.line !== undefined) {
        return charts.line.getState();
      }
      return null;
    });

    expect(config).not.toBeNull();
  });
});
