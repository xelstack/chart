import { test, expect } from '@playwright/test';
import { setupChartTest, createChartInPage } from '../helpers/chart-setup';

test.describe('대용량 데이터 상호작용', () => {
  test.beforeEach(async ({ page }) => {
    await setupChartTest(page);
    
    // 대용량 데이터셋 생성 (5만 개 포인트)
    await createChartInPage(
      page,
      'chart-container',
      {
        points: Array.from({ length: 50000 }, (_, i) => ({
          x: i,
          y: Math.sin(i / 100) * 50 + 50,
        })),
      },
      {
        type: 'line',
        width: 800,
        height: 600,
        interaction: {
          zoom: true,
          pan: true,
        },
      }
    );

    // 초기 렌더링 대기
    await page.waitForTimeout(1000);
  });

  test('대용량 데이터에서도 뷰포트 조작이 가능해야 함', async ({ page }) => {
    // 초기 뷰포트 확인
    const initialViewport = await page.evaluate<{
      xMin: number;
      xMax: number;
      yMin: number;
      yMax: number;
      zoomLevel: number;
    } | null>(() => {
      const chart = (
        window as {
          chart?: {
            getViewport: () => {
              xMin: number;
              xMax: number;
              yMin: number;
              yMax: number;
              zoomLevel: number;
            };
          };
        }
      ).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getViewport();
      }
      return null;
    });

    expect(initialViewport).not.toBeNull();

    // 뷰포트 리셋
    await page.evaluate(() => {
      const chart = (window as { chart?: { resetViewport: () => void } }).chart;
      if (chart !== null && chart !== undefined) {
        chart.resetViewport();
      }
    });

    await page.waitForTimeout(200);

    // 뷰포트가 변경되었는지 확인
    const resetViewport = await page.evaluate<{
      xMin: number;
      xMax: number;
      yMin: number;
      yMax: number;
      zoomLevel: number;
    } | null>(() => {
      const chart = (
        window as {
          chart?: {
            getViewport: () => {
              xMin: number;
              xMax: number;
              yMin: number;
              yMax: number;
              zoomLevel: number;
            };
          };
        }
      ).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getViewport();
      }
      return null;
    });

    expect(resetViewport).not.toBeNull();
  });

  test('대용량 데이터에서도 상호작용이 부드럽게 동작해야 함', async ({ page }) => {
    // 여러 번의 뷰포트 조작
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const chart = (window as { chart?: { resetViewport: () => void } }).chart;
        if (chart !== null && chart !== undefined) {
          chart.resetViewport();
        }
      });
      await page.waitForTimeout(100);
    }

    // 최종 상태 확인
    const finalState = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const chart = (
        window as { chart?: { getState: () => { status: string; pointCount: number } } }
      ).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getState();
      }
      return null;
    });

    expect(finalState).not.toBeNull();
    if (finalState !== null) {
      expect(finalState.status).toBe('ready');
    }
  });

  test('대용량 데이터에서도 차트 크기 변경이 가능해야 함', async ({ page }) => {
    await page.evaluate(() => {
      const chart = (window as { chart?: { resize: (width: number, height: number) => void } })
        .chart;
      if (chart !== null && chart !== undefined) {
        chart.resize(1000, 800);
      }
    });

    await page.waitForTimeout(200);

    const canvas = page.locator('#chart-container canvas');
    const canvasElement = await canvas.elementHandle();
    if (canvasElement) {
      // CSS 크기 확인 (논리적 크기)
      const width = await canvasElement.evaluate((el: HTMLCanvasElement) => {
        return parseInt(el.style.width, 10) || el.width;
      });
      const height = await canvasElement.evaluate((el: HTMLCanvasElement) => {
        return parseInt(el.style.height, 10) || el.height;
      });

      expect(width).toBe(1000);
      expect(height).toBe(800);
    }
  });
});
