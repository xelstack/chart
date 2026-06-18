/**
 * 실시간 업데이트 성능 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createChart } from '../../src/api/create-chart';
import type { Dataset, ChartConfig } from '../../src/types/index';

describe('Realtime Update Performance', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    vi.restoreAllMocks();

    // Mock DOM environment
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';

    // Save original createElement
    const originalCreateElement = document.createElement.bind(document);

    // Mock document.createElement to return a new canvas each time
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        const canvas = originalCreateElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        Object.defineProperty(canvas, 'clientWidth', { value: 800 });
        Object.defineProperty(canvas, 'clientHeight', { value: 600 });

        // Mock getContext
        const mockCtx = {
          canvas,
          clearRect: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          strokeStyle: '',
          fillStyle: '',
          lineWidth: 0,
          font: '',
          textAlign: '',
          textBaseline: '',
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          stroke: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn(() => ({ width: 50 })),
          drawImage: vi.fn(),
        } as unknown as CanvasRenderingContext2D;

        vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx);
        return canvas;
      }
      return originalCreateElement(tagName);
    });
  });

  it('초당 1000개 포인트 추가가 60fps를 유지해야 함', () => {
    const initialDataset: Dataset = {
      points: [{ x: 0, y: 10 }],
    };

    const config: Partial<ChartConfig> = {
      type: 'line',
      width: 800,
      height: 600,
    };

    const chart = createChart(container, initialDataset, config);

    // 1000개 포인트를 10번에 나눠 추가 (초당 1000개 시뮬레이션)
    const batchSize = 100;
    const iterations = 10;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const newPoints = Array.from({ length: batchSize }, (_, j) => ({
        x: i * batchSize + j + 1,
        y: Math.random() * 100,
      }));

      chart.addPoints(newPoints, { autoRender: true });
    }
    const duration = performance.now() - start;

    // 60fps = 16.67ms per frame
    // 10회 업데이트가 200ms 이내여야 함 (여유 포함)
    expect(duration).toBeLessThan(200);

    console.log(`Added 1000 points in ${iterations} batches: ${duration.toFixed(2)}ms`);
  });

  it('multi-series 실시간 업데이트가 효율적이어야 함', () => {
    // 100개 시리즈로 시작
    const initialDataset: Dataset = {
      points: Array.from({ length: 100 }, (_, i) => ({
        x: 0,
        y: Math.random() * 100,
        series: `Series ${i + 1}`,
      })),
    };

    const config: Partial<ChartConfig> = {
      type: 'line',
      width: 800,
      height: 600,
    };

    const chart = createChart(container, initialDataset, config);

    // 각 시리즈에 포인트 추가 (100개 포인트 추가)
    const start = performance.now();
    const newPoints = Array.from({ length: 100 }, (_, i) => ({
      x: 1,
      y: Math.random() * 100,
      series: `Series ${i + 1}`,
    }));

    chart.addPoints(newPoints, { autoRender: true });
    const duration = performance.now() - start;

    // 100개 시리즈 업데이트가 50ms 이내여야 함
    expect(duration).toBeLessThan(50);

    console.log(`Added 100 points to 100 series: ${duration.toFixed(2)}ms`);
  });

  it('대용량 데이터셋에서 실시간 업데이트가 안정적이어야 함', () => {
    // 10,000개 초기 포인트
    const initialDataset: Dataset = {
      points: Array.from({ length: 10000 }, (_, i) => ({
        x: i,
        y: Math.random() * 100,
      })),
    };

    const config: Partial<ChartConfig> = {
      type: 'line',
      width: 800,
      height: 600,
    };

    const chart = createChart(container, initialDataset, config);

    // 100개 포인트 추가
    const start = performance.now();
    const newPoints = Array.from({ length: 100 }, (_, i) => ({
      x: 10000 + i,
      y: Math.random() * 100,
    }));

    chart.addPoints(newPoints, { autoRender: true });
    const duration = performance.now() - start;

    // 대용량 데이터셋에서도 30ms 이내여야 함
    expect(duration).toBeLessThan(30);

    console.log(
      `Added 100 points to 10K dataset: ${duration.toFixed(2)}ms`
    );
  });

  it('연속 업데이트 시 성능이 일정해야 함 (메모리 누수 없음)', () => {
    const initialDataset: Dataset = {
      points: [{ x: 0, y: 10 }],
    };

    const config: Partial<ChartConfig> = {
      type: 'line',
      width: 800,
      height: 600,
    };

    const chart = createChart(container, initialDataset, config);

    // 처음 10회 평균 시간
    const timings1: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      chart.addPoints([{ x: i + 1, y: Math.random() * 100 }], {
        autoRender: true,
      });
      timings1.push(performance.now() - start);
    }
    const avg1 = timings1.reduce((a, b) => a + b, 0) / timings1.length;

    // 100회 더 업데이트 후 다시 10회 평균 시간
    for (let i = 0; i < 100; i++) {
      chart.addPoints([{ x: i + 11, y: Math.random() * 100 }], {
        autoRender: true,
      });
    }

    const timings2: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      chart.addPoints([{ x: i + 111, y: Math.random() * 100 }], {
        autoRender: true,
      });
      timings2.push(performance.now() - start);
    }
    const avg2 = timings2.reduce((a, b) => a + b, 0) / timings2.length;

    // 100회 업데이트 후에도 성능이 크게 저하되지 않아야 함
    // 시스템 부하 변동성 고려: 최소 기준값 5ms 또는 첫 측정의 50배 중 큰 값
    const threshold = Math.max(avg1 * 50, 5);
    expect(avg2).toBeLessThan(threshold);

    console.log(`First 10 avg: ${avg1.toFixed(2)}ms`);
    console.log(`After 100 updates avg: ${avg2.toFixed(2)}ms`);
  });

  it('viewport 자동 스크롤이 효율적이어야 함', () => {
    const initialDataset: Dataset = {
      points: [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ],
    };

    const config: Partial<ChartConfig> = {
      type: 'line',
      width: 800,
      height: 600,
    };

    const chart = createChart(container, initialDataset, config);

    // 100개 포인트를 autoScroll: true로 추가
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      chart.addPoints([{ x: i + 2, y: Math.random() * 100 }], {
        autoScroll: true,
        autoRender: false, // 렌더링 제외하고 스크롤만 측정
      });
    }
    const duration = performance.now() - start;

    // 100회 스크롤이 50ms 이내여야 함
    expect(duration).toBeLessThan(50);

    console.log(`100 viewport auto-scrolls: ${duration.toFixed(2)}ms`);
  });
});
