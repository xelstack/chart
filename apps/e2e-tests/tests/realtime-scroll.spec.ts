import { test, expect } from '@playwright/test';
import { setupChartTest, createChartInPage } from '../helpers/chart-setup';

test.describe('실시간 차트 스크롤', () => {
  test.beforeEach(async ({ page }) => {
    await setupChartTest(page);
  });

  test('실시간 모드에서 최대 포인트 수를 제한할 수 있어야 함', async ({ page }) => {
    // 실시간 모드로 차트 생성 (최대 5개 포인트)
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
        realtime: {
          enabled: true,
          maxPoints: 5,
          scrollDirection: 'left-to-right',
        },
      }
    );

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

    // 최대 포인트 수를 초과하는 데이터 업데이트
    await page.evaluate(() => {
      const chart = (window as { chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void } }).chart;
      if (chart !== null && chart !== undefined) {
        const newDataset = {
          points: Array.from({ length: 10 }, (_, i) => ({ x: i, y: 10 + i * 5 })),
        };
        chart.updateData(newDataset);
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
      // 최대 포인트 수로 제한되어야 함
      expect(updatedState.pointCount).toBe(5);
      expect(updatedState.status).toBe('ready');
    }
  });

  test('왼쪽에서 오른쪽으로 스크롤할 수 있어야 함', async ({ page }) => {
    // 실시간 모드로 차트 생성
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
        realtime: {
          enabled: true,
          maxPoints: 10,
          scrollDirection: 'left-to-right',
        },
      }
    );

    // 초기 뷰포트 확인
    const initialViewport = await page.evaluate<{ xMin: number; xMax: number } | null>(() => {
      const chart = (window as { chart?: { getViewport: () => { xMin: number; xMax: number } } }).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getViewport();
      }
      return null;
    });

    expect(initialViewport).not.toBeNull();

    // 새로운 포인트 추가 (x 값이 증가)
    await page.evaluate(() => {
      const chart = (window as { chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void } }).chart;
      if (chart !== null && chart !== undefined) {
        const newDataset = {
          points: [
            { x: 0, y: 10 },
            { x: 1, y: 20 },
            { x: 2, y: 15 },
            { x: 10, y: 25 }, // 새로운 포인트 (x 값이 크게 증가)
          ],
        };
        chart.updateData(newDataset);
      }
    });

    // 업데이트 후 뷰포트 확인
    await page.waitForTimeout(100);

    const updatedViewport = await page.evaluate<{ xMin: number; xMax: number } | null>(() => {
      const chart = (window as { chart?: { getViewport: () => { xMin: number; xMax: number } } }).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getViewport();
      }
      return null;
    });

    expect(updatedViewport).not.toBeNull();
    if (initialViewport !== null && updatedViewport !== null) {
      // 오른쪽으로 스크롤되었으므로 xMax가 증가해야 함
      expect(updatedViewport.xMax).toBeGreaterThan(initialViewport.xMax);
    }
  });

  test('오른쪽에서 왼쪽으로 스크롤할 수 있어야 함', async ({ page }) => {
    // 실시간 모드로 차트 생성
    await createChartInPage(
      page,
      'chart-container',
      {
        points: [
          { x: 10, y: 10 },
          { x: 11, y: 20 },
          { x: 12, y: 15 },
        ],
      },
      {
        type: 'line',
        width: 800,
        height: 600,
        realtime: {
          enabled: true,
          maxPoints: 10,
          scrollDirection: 'right-to-left',
        },
      }
    );

    // 초기 뷰포트 확인
    const initialViewport = await page.evaluate<{ xMin: number; xMax: number } | null>(() => {
      const chart = (window as { chart?: { getViewport: () => { xMin: number; xMax: number } } }).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getViewport();
      }
      return null;
    });

    expect(initialViewport).not.toBeNull();

    // 새로운 포인트 추가 (x 값이 감소)
    await page.evaluate(() => {
      const chart = (window as { chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void } }).chart;
      if (chart !== null && chart !== undefined) {
        const newDataset = {
          points: [
            { x: 10, y: 10 },
            { x: 11, y: 20 },
            { x: 12, y: 15 },
            { x: 0, y: 25 }, // 새로운 포인트 (x 값이 크게 감소)
          ],
        };
        chart.updateData(newDataset);
      }
    });

    // 업데이트 후 뷰포트 확인
    await page.waitForTimeout(100);

    const updatedViewport = await page.evaluate<{ xMin: number; xMax: number } | null>(() => {
      const chart = (window as { chart?: { getViewport: () => { xMin: number; xMax: number } } }).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getViewport();
      }
      return null;
    });

    expect(updatedViewport).not.toBeNull();
    if (initialViewport !== null && updatedViewport !== null) {
      // 왼쪽으로 스크롤되었으므로 xMin이 감소해야 함
      expect(updatedViewport.xMin).toBeLessThan(initialViewport.xMin);
    }
  });

  test('실시간 모드가 비활성화된 경우 기존 동작을 유지해야 함', async ({ page }) => {
    // 실시간 모드 없이 차트 생성
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

    // 많은 포인트 추가
    await page.evaluate(() => {
      const chart = (window as { chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void } }).chart;
      if (chart !== null && chart !== undefined) {
        const newDataset = {
          points: Array.from({ length: 20 }, (_, i) => ({ x: i, y: 10 + i * 5 })),
        };
        chart.updateData(newDataset);
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
      // 실시간 모드가 아니므로 모든 포인트가 유지되어야 함
      expect(updatedState.pointCount).toBe(20);
      expect(updatedState.status).toBe('ready');
    }
  });
});

