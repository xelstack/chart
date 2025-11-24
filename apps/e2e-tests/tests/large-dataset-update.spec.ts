import { test, expect } from '@playwright/test';
import { setupChartTest, createChartInPage } from '../helpers/chart-setup';

test.describe('대용량 데이터 업데이트', () => {
  test.beforeEach(async ({ page }) => {
    await setupChartTest(page);
    
    // 초기 대용량 데이터셋 생성 (5만 개 포인트)
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
      }
    );

    // 초기 렌더링 대기
    await page.waitForTimeout(1000);
  });

  test('대용량 데이터셋 업데이트가 처리되어야 함', async ({ page }) => {
    // 초기 상태 확인
    const initialState = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const chart = (
        window as { chart?: { getState: () => { status: string; pointCount: number } } }
      ).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getState();
      }
      return null;
    });

    expect(initialState).not.toBeNull();
    if (initialState !== null) {
      expect(initialState.pointCount).toBe(50000);
    }

    // 대용량 데이터셋 업데이트 (10만 개 포인트)
    await page.evaluate(() => {
      const chart = (
        window as {
          chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void };
        }
      ).chart;
      if (chart !== null && chart !== undefined) {
        const newDataset = {
          points: Array.from({ length: 100000 }, (_, i) => ({
            x: i,
            y: Math.cos(i / 100) * 50 + 50,
          })),
        };
        chart.updateData(newDataset);
      }
    });

    // 업데이트 완료 대기
    await page.waitForTimeout(2000);

    // 업데이트 후 상태 확인
    const updatedState = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const chart = (
        window as { chart?: { getState: () => { status: string; pointCount: number } } }
      ).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getState();
      }
      return null;
    });

    expect(updatedState).not.toBeNull();
    if (updatedState !== null) {
      expect(updatedState.pointCount).toBe(100000);
      expect(updatedState.status).toBe('ready');
    }
  });

  test('대용량 데이터셋 연속 업데이트가 처리되어야 함', async ({ page }) => {
    // 여러 번의 업데이트
    for (let i = 0; i < 3; i++) {
      await page.evaluate((count) => {
        const chart = (
          window as {
            chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void };
          }
        ).chart;
        if (chart !== null && chart !== undefined) {
          const dataset = {
            points: Array.from({ length: 50000 + count * 10000 }, (_, j) => ({
              x: j,
              y: Math.sin(j / 100 + count) * 50 + 50,
            })),
          };
          chart.updateData(dataset);
        }
      }, i);
      await page.waitForTimeout(500);
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
      expect(finalState.pointCount).toBeGreaterThan(50000);
    }
  });

  test('대용량 데이터셋 업데이트 중에도 성능이 유지되어야 함', async ({ page }) => {
    const startTime = Date.now();

    // 빠른 연속 업데이트
    await page.evaluate(() => {
      const chart = (
        window as {
          chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void };
        }
      ).chart;
      if (chart !== null && chart !== undefined) {
        for (let i = 0; i < 5; i++) {
          const dataset = {
            points: Array.from({ length: 50000 }, (_, j) => ({
              x: j,
              y: Math.sin(j / 100 + i) * 50 + 50,
            })),
          };
          chart.updateData(dataset);
        }
      }
    });

    // 업데이트 완료 대기
    await page.waitForTimeout(2000);

    const endTime = Date.now();
    const updateTime = endTime - startTime;

    // 업데이트가 합리적인 시간 내에 완료되어야 함
    expect(updateTime).toBeLessThan(5000);

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
});
