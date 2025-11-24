import { test, expect } from '@playwright/test';
import { setupChartTest, createChartInPage } from '../helpers/chart-setup';

test.describe('실시간 데이터 업데이트', () => {
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
          { x: 2, y: 15 },
        ],
      },
      {
        type: 'line',
        width: 800,
        height: 600,
      }
    );
  });

  test('새로운 데이터 포인트를 추가할 수 있어야 함', async ({ page }) => {
    // 초기 상태 확인
    const initialState = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const chart = (window as { chart?: { getState: () => { status: string; pointCount: number } } }).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getState();
      }
      return null;
    });

    expect(initialState).not.toBeNull();
    if (initialState !== null) {
      expect(initialState.pointCount).toBe(3);
    }

    // 데이터 업데이트
    await page.evaluate(() => {
      const chart = (window as { chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void } }).chart;
      if (chart !== null && chart !== undefined) {
        const newDataset = {
          points: [
            { x: 0, y: 10 },
            { x: 1, y: 20 },
            { x: 2, y: 15 },
            { x: 3, y: 25 }
          ]
        };
        chart.updateData(newDataset);
      }
    });

    // 업데이트 후 상태 확인
    await page.waitForTimeout(100); // 업데이트 완료 대기

    const updatedState = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const chart = (window as { chart?: { getState: () => { status: string; pointCount: number } } }).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getState();
      }
      return null;
    });

    expect(updatedState).not.toBeNull();
    if (updatedState !== null) {
      expect(updatedState.pointCount).toBe(4);
      expect(updatedState.status).toBe('ready');
    }
  });

  test('기존 데이터 포인트를 수정할 수 있어야 함', async ({ page }) => {
    // 데이터 업데이트
    await page.evaluate(() => {
      const chart = (window as { chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void } }).chart;
      if (chart !== null && chart !== undefined) {
        const updatedDataset = {
          points: [
            { x: 0, y: 15 }, // 변경됨
            { x: 1, y: 25 }, // 변경됨
            { x: 2, y: 20 }  // 변경됨
          ]
        };
        chart.updateData(updatedDataset);
      }
    });

    // 업데이트 후 상태 확인
    await page.waitForTimeout(100);

    const updatedState = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const chart = (window as { chart?: { getState: () => { status: string; pointCount: number } } }).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getState();
      }
      return null;
    });

    expect(updatedState).not.toBeNull();
    if (updatedState !== null) {
      expect(updatedState.pointCount).toBe(3);
      expect(updatedState.status).toBe('ready');
    }
  });

  test('연속적인 업데이트가 처리되어야 함', async ({ page }) => {
    // 빠른 연속 업데이트
    await page.evaluate(() => {
      const chart = (window as { chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void } }).chart;
      if (chart !== null && chart !== undefined) {
        for (let i = 0; i < 5; i++) {
          const dataset = {
            points: [
              { x: 0, y: 10 + i },
              { x: 1, y: 20 + i },
              { x: 2, y: 15 + i }
            ]
          };
          chart.updateData(dataset);
        }
      }
    });

    // 최종 상태 확인
    await page.waitForTimeout(200);

    const finalState = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const chart = (window as { chart?: { getState: () => { status: string; pointCount: number } } }).chart;
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

