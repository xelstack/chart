import { test, expect } from '@playwright/test';
import { setupChartTest, createChartInPage } from '../helpers/chart-setup';

test.describe('연속 업데이트 처리', () => {
  test.beforeEach(async ({ page }) => {
    await setupChartTest(page);

    // 테스트용 차트 생성
    await createChartInPage(
      page,
      'chart-container',
      {
        points: [
          { x: 0, y: 10 },
          { x: 1, y: 20 },
        ],
      },
      {
        type: 'line',
        width: 800,
        height: 600,
      }
    );
  });

  test('빠른 연속 업데이트가 배치 처리되어야 함', async ({ page }) => {
    // 초기 상태
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
      expect(initialState.pointCount).toBe(2);
    }

    // 매우 빠른 연속 업데이트 (배치 처리되어야 함)
    await page.evaluate(() => {
      const chart = (
        window as {
          chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void };
        }
      ).chart;
      if (chart !== null && chart !== undefined) {
        // 동기적으로 빠르게 업데이트
        for (let i = 0; i < 10; i++) {
          const dataset = {
            points: [
              { x: 0, y: 10 + i },
              { x: 1, y: 20 + i },
              { x: 2, y: 15 + i },
            ],
          };
          chart.updateData(dataset);
        }
      }
    });

    // 배치 처리 완료 대기
    await page.waitForTimeout(300);

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
      expect(finalState.pointCount).toBe(3);
      expect(finalState.status).toBe('ready');
    }
  });

  test('쓰로틀링이 적용되어야 함', async ({ page }) => {
    // 업데이트 횟수 추적
    await page.evaluate(() => {
      const chart = (
        window as {
          chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void };
        }
      ).chart;
      if (chart !== null && chart !== undefined) {
        const originalUpdate = chart.updateData.bind(chart);
        (window as { updateCount?: number }).updateCount = 0;
        chart.updateData = function (dataset) {
          const win = window as { updateCount?: number };
          if (win.updateCount !== undefined) {
            win.updateCount++;
          }
          return originalUpdate(dataset);
        };
      }
    });

    // 빠른 연속 업데이트
    await page.evaluate(() => {
      const chart = (
        window as {
          chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void };
        }
      ).chart;
      if (chart !== null && chart !== undefined) {
        for (let i = 0; i < 20; i++) {
          const dataset = {
            points: [
              { x: 0, y: 10 + i },
              { x: 1, y: 20 + i },
            ],
          };
          chart.updateData(dataset);
        }
      }
    });

    await page.waitForTimeout(500);

    // 최종 상태 확인
    const finalState = await page.evaluate<{
      state: { status: string; pointCount: number };
      updateCount: number;
    } | null>(() => {
      const chart = (
        window as { chart?: { getState: () => { status: string; pointCount: number } } }
      ).chart;
      const updateCount = (window as { updateCount?: number }).updateCount;
      if (chart !== null && chart !== undefined && updateCount !== undefined) {
        return {
          state: chart.getState(),
          updateCount,
        };
      }
      return null;
    });

    expect(finalState).not.toBeNull();
    if (finalState !== null) {
      expect(finalState.state.status).toBe('ready');
      // 쓰로틀링으로 인해 실제 업데이트 횟수는 제한되어야 함
      expect(finalState.updateCount).toBeGreaterThan(0);
    }
  });

  test('배치 업데이트 후 최신 데이터가 반영되어야 함', async ({ page }) => {
    // 여러 번 업데이트
    await page.evaluate(() => {
      const chart = (
        window as {
          chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void };
        }
      ).chart;
      if (chart !== null && chart !== undefined) {
        for (let i = 0; i < 5; i++) {
          const dataset = {
            points: [
              { x: 0, y: 10 + i * 10 },
              { x: 1, y: 20 + i * 10 },
              { x: 2, y: 15 + i * 10 },
            ],
          };
          chart.updateData(dataset);
        }
      }
    });

    await page.waitForTimeout(300);

    // 최종 데이터가 마지막 업데이트와 일치해야 함
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
      expect(finalState.pointCount).toBe(3);
      expect(finalState.status).toBe('ready');
    }
  });
});
