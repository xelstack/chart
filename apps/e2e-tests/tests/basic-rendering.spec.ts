import { test, expect } from '@playwright/test';
import { setupChartTest, createChartInPage } from '../helpers/chart-setup';

test.describe('기본 차트 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await setupChartTest(page);

    // 기본 차트 생성
    await createChartInPage(
      page,
      'chart-container',
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
  });

  test('차트가 정상적으로 렌더링되어야 함', async ({ page }) => {
    // 차트 컨테이너가 존재하는지 확인
    const container = page.locator('#chart-container');
    await expect(container).toBeVisible();

    // Canvas 요소가 생성되었는지 확인
    const canvas = container.locator('canvas');
    await expect(canvas).toBeVisible();

    // Canvas 크기 확인 (CSS 크기 확인 - 논리적 크기)
    const canvasElement = await canvas.elementHandle();
    if (canvasElement) {
      // CSS 크기 확인 (논리적 크기)
      const styleWidth = await canvasElement.evaluate((el: HTMLCanvasElement) => {
        return parseInt(el.style.width, 10) || el.width;
      });
      const styleHeight = await canvasElement.evaluate((el: HTMLCanvasElement) => {
        return parseInt(el.style.height, 10) || el.height;
      });

      // devicePixelRatio가 적용되어 있을 수 있으므로 CSS 크기 확인
      expect(styleWidth).toBe(800);
      expect(styleHeight).toBe(600);
    }
  });

  test('차트 인스턴스가 생성되어야 함', async ({ page }) => {
    // window.chart 객체가 존재하는지 확인
    const chartExists = await page.evaluate(() => {
      return (
        typeof (window as { chart?: unknown }).chart !== 'undefined' &&
        (window as { chart?: unknown }).chart !== null
      );
    });

    expect(chartExists).toBe(true);
  });

  test('차트 상태가 ready여야 함', async ({ page }) => {
    const state = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const chart = (
        window as { chart?: { getState: () => { status: string; pointCount: number } } }
      ).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getState();
      }
      return null;
    });

    expect(state).not.toBeNull();
    if (state !== null) {
      expect(state.status).toBe('ready');
      expect(state.pointCount).toBe(5);
    }
  });
});
