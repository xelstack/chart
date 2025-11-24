import { test, expect } from '@playwright/test';
import { setupChartTest, createChartInPage } from '../helpers/chart-setup';

test.describe('업데이트 중 상호작용 유지', () => {
  test.beforeEach(async ({ page }) => {
    await setupChartTest(page);
    
    // 상호작용 테스트용 차트 생성
    await createChartInPage(
      page,
      'chart-container',
      {
        points: Array.from({ length: 10 }, (_, i) => ({ x: i, y: Math.random() * 100 })),
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
  });

  test('업데이트 중에도 뷰포트 조작이 가능해야 함', async ({ page }) => {
    // 초기 뷰포트 확인
    const initialViewport = await page.evaluate<{ xMin: number; xMax: number; yMin: number; yMax: number; zoomLevel: number } | null>(() => {
      const chart = (window as { chart?: { getViewport: () => { xMin: number; xMax: number; yMin: number; yMax: number; zoomLevel: number } } }).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getViewport();
      }
      return null;
    });

    expect(initialViewport).not.toBeNull();

    // 업데이트 시작
    const updatePromise = page.evaluate(() => {
      const chart = (window as { chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void } }).chart;
      if (chart !== null && chart !== undefined) {
        return new Promise<void>((resolve) => {
          let count = 0;
          const interval = setInterval(() => {
            const dataset = {
              points: Array.from({ length: 10 }, (_, i) => ({ 
                x: i, 
                y: Math.random() * 100 + count 
              }))
            };
            chart.updateData(dataset);
            count++;
            if (count >= 5) {
              clearInterval(interval);
              resolve();
            }
          }, 50);
        });
      }
      return Promise.resolve();
    });

    // 업데이트 중 뷰포트 조작 시도
    await page.evaluate(() => {
      const chart = (window as { chart?: { resetViewport: () => void } }).chart;
      if (chart !== null && chart !== undefined) {
        // 뷰포트 리셋 시도
        chart.resetViewport();
      }
    });

    await updatePromise;
    await page.waitForTimeout(100);

    // 뷰포트가 정상적으로 유지되어야 함
    const finalViewport = await page.evaluate<{ xMin: number; xMax: number; yMin: number; yMax: number; zoomLevel: number } | null>(() => {
      const chart = (window as { chart?: { getViewport: () => { xMin: number; xMax: number; yMin: number; yMax: number; zoomLevel: number } } }).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getViewport();
      }
      return null;
    });

    expect(finalViewport).not.toBeNull();
  });

  test('업데이트 중에도 차트 상태 조회가 가능해야 함', async ({ page }) => {
    // 업데이트 시작 (외부에서 트리거)
    let updateCount = 0;
    const updateInterval = setInterval(() => {
      void page.evaluate((count) => {
        const chart = (window as { chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void } }).chart;
        if (chart !== null && chart !== undefined) {
          const dataset = {
            points: Array.from({ length: 5 }, (_, i) => ({ 
              x: i, 
              y: 10 + count 
            }))
          };
          chart.updateData(dataset);
        }
      }, updateCount);
      updateCount++;
      if (updateCount >= 3) {
        clearInterval(updateInterval);
      }
    }, 50);

    // 업데이트 중 상태 조회
    const states: Array<{ status: string; pointCount: number }> = [];
    
    while (states.length < 5 && updateCount < 3) {
      const state = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
        const chart = (window as { chart?: { getState: () => { status: string; pointCount: number } } }).chart;
        if (chart !== null && chart !== undefined) {
          return chart.getState();
        }
        return null;
      });
      
      if (state !== null) {
        states.push({ status: state.status, pointCount: state.pointCount });
      }
      
      await page.waitForTimeout(50);
    }

    // 업데이트 완료 대기
    await page.waitForTimeout(200);

    // 상태가 정상적으로 조회되어야 함
    expect(states.length).toBeGreaterThan(0);
    states.forEach(state => {
      expect(state.status).toBeDefined();
      expect(state.pointCount).toBeGreaterThan(0);
    });
  });

  test('업데이트 중에도 설정 변경이 가능해야 함', async ({ page }) => {
    // 업데이트 시작 (외부에서 트리거)
    let updateCount = 0;
    const updateInterval = setInterval(() => {
      void page.evaluate((count) => {
        const chart = (window as { chart?: { updateData: (dataset: { points: Array<{ x: number; y: number }> }) => void } }).chart;
        if (chart !== null && chart !== undefined) {
          const dataset = {
            points: Array.from({ length: 5 }, (_, i) => ({ 
              x: i, 
              y: 10 + count 
            }))
          };
          chart.updateData(dataset);
        }
      }, updateCount);
      updateCount++;
      if (updateCount >= 3) {
        clearInterval(updateInterval);
      }
    }, 50);

    // 업데이트 중 설정 변경
    await page.waitForTimeout(50); // 첫 업데이트 후 설정 변경
    await page.evaluate(() => {
      const chart = (window as { chart?: { updateConfig: (config: { title?: string; colors?: string[] }) => void } }).chart;
      if (chart !== null && chart !== undefined) {
        chart.updateConfig({
          title: 'Updated Title',
          colors: ['#FF0000'],
        });
      }
    });

    // 업데이트 완료 대기
    await page.waitForTimeout(300);

    // 최종 상태 확인
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

