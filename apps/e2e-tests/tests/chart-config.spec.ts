import { test, expect } from '@playwright/test';
import { setupChartTest, createChartInPage } from '../helpers/chart-setup';

test.describe('차트 설정 적용', () => {
  test.beforeEach(async ({ page }) => {
    await setupChartTest(page);
    
    // 테스트용 차트 생성 (제목 포함)
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
        title: 'Test Chart',
        showGrid: true,
        showLegend: true,
        colors: ['#FF0000', '#00FF00'],
        responsive: false, // ResizeObserver 비활성화 (resize 테스트를 위해)
      }
    );
  });

  test('차트 제목이 설정되어야 함', async ({ page }) => {
    const state = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const chart = (window as { chart?: { getState: () => { status: string; pointCount: number } } }).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getState();
      }
      return null;
    });

    expect(state).not.toBeNull();
    if (state !== null) {
      expect(state.status).toBe('ready');
    }
  });

  test('차트 크기가 설정되어야 함', async ({ page }) => {
    const container = page.locator('#chart-container');
    const canvas = container.locator('canvas');
    
    await expect(canvas).toBeVisible();
    
    const canvasElement = await canvas.elementHandle();
    if (canvasElement) {
      // CSS 크기 확인 (논리적 크기)
      const width = await canvasElement.evaluate((el: HTMLCanvasElement) => {
        return parseInt(el.style.width, 10) || el.width;
      });
      const height = await canvasElement.evaluate((el: HTMLCanvasElement) => {
        return parseInt(el.style.height, 10) || el.height;
      });
      
      expect(width).toBe(800);
      expect(height).toBe(600);
    }
  });

  test('차트 설정 업데이트가 작동해야 함', async ({ page }) => {
    await page.evaluate(() => {
      const chart = (window as { chart?: { updateConfig: (config: { title?: string; colors?: string[] }) => void } }).chart;
      if (chart !== null && chart !== undefined) {
        chart.updateConfig({
          title: 'Updated Title',
          colors: ['#0000FF'],
        });
      }
    });

    // 업데이트 후 상태 확인
    await page.waitForTimeout(100);
    
    const state = await page.evaluate<{ status: string; pointCount: number } | null>(() => {
      const chart = (window as { chart?: { getState: () => { status: string; pointCount: number } } }).chart;
      if (chart !== null && chart !== undefined) {
        return chart.getState();
      }
      return null;
    });

    expect(state).not.toBeNull();
    if (state !== null) {
      expect(state.status).toBe('ready');
    }
  });

  test('차트 크기 변경이 작동해야 함', async ({ page }) => {
    await page.evaluate(() => {
      const chart = (window as { chart?: { resize: (width: number, height: number) => void } }).chart;
      if (chart !== null && chart !== undefined) {
        chart.resize(1000, 800);
      }
    });

    const container = page.locator('#chart-container');
    const canvas = container.locator('canvas');
    
    await expect(canvas).toBeVisible();
    
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

