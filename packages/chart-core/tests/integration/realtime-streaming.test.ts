/**
 * 실시간 데이터 스트리밍 통합 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createChart } from '../../src/api/create-chart';
import type { Dataset, ChartConfig } from '../../src/types/index';

describe('Realtime Streaming', () => {
  let container: HTMLDivElement;
  let clearRectSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    vi.restoreAllMocks();

    // Mock DOM environment
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Save original createElement
    const originalCreateElement = document.createElement.bind(document);

    // 모든 캔버스에서 공유하는 clearRect spy 생성
    clearRectSpy = vi.fn();

    // Mock document.createElement to return a new canvas each time
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        const canvas = originalCreateElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        Object.defineProperty(canvas, 'clientWidth', { value: 800 });
        Object.defineProperty(canvas, 'clientHeight', { value: 600 });

        // Mock getContext - 모든 캔버스에서 동일한 clearRectSpy 사용
        const mockCtx = {
          canvas,
          clearRect: clearRectSpy,
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

  describe('addPoints method', () => {
    it('should add new points to dataset', () => {
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

      // addPoints 메서드가 존재해야 함
      expect(chart).toHaveProperty('addPoints');

      // 새 포인트 추가
      chart.addPoints([
        { x: 2, y: 30 },
        { x: 3, y: 40 },
      ]);

      // 상태 확인
      const state = chart.getState();
      expect(state.dataset?.points).toHaveLength(4);
      expect(state.dataset?.points?.[2]).toEqual({ x: 2, y: 30 });
      expect(state.dataset?.points?.[3]).toEqual({ x: 3, y: 40 });
    });

    it('should handle multi-series data', () => {
      const initialDataset: Dataset = {
        points: [
          { x: 0, y: 10, series: 'A' },
          { x: 1, y: 20, series: 'A' },
          { x: 0, y: 15, series: 'B' },
          { x: 1, y: 25, series: 'B' },
        ],
      };

      const config: Partial<ChartConfig> = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const chart = createChart(container, initialDataset, config);

      // 여러 시리즈에 포인트 추가
      chart.addPoints([
        { x: 2, y: 30, series: 'A' },
        { x: 2, y: 35, series: 'B' },
        { x: 2, y: 20, series: 'C' }, // 새 시리즈
      ]);

      const state = chart.getState();
      expect(state.dataset?.points).toHaveLength(7);

      // 시리즈별 포인트 확인
      const seriesA = state.dataset?.points?.filter((p) => p.series === 'A');
      const seriesB = state.dataset?.points?.filter((p) => p.series === 'B');
      const seriesC = state.dataset?.points?.filter((p) => p.series === 'C');

      expect(seriesA).toHaveLength(3);
      expect(seriesB).toHaveLength(3);
      expect(seriesC).toHaveLength(1);
    });

    it('should auto-render when autoRender is enabled', () => {
      const initialDataset: Dataset = {
        points: [{ x: 0, y: 10 }],
      };

      const config: Partial<ChartConfig> = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const chart = createChart(container, initialDataset, config);

      // 초기 렌더링 호출 기록 초기화
      clearRectSpy.mockClear();

      // autoRender: true로 포인트 추가
      chart.addPoints([{ x: 1, y: 20 }], { autoRender: true });

      // clearRect가 호출되어야 함 (렌더링이 발생했다는 의미)
      expect(clearRectSpy).toHaveBeenCalled();
    });

    it('should not auto-render when autoRender is disabled', () => {
      const initialDataset: Dataset = {
        points: [{ x: 0, y: 10 }],
      };

      const config: Partial<ChartConfig> = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const chart = createChart(container, initialDataset, config);

      // 초기 렌더링 호출 기록 초기화
      clearRectSpy.mockClear();

      // autoRender: false로 포인트 추가
      chart.addPoints([{ x: 1, y: 20 }], { autoRender: false });

      // clearRect가 호출되지 않아야 함 (렌더링이 발생하지 않았다는 의미)
      expect(clearRectSpy).not.toHaveBeenCalled();
    });
  });

  describe('viewport auto-scroll', () => {
    it('should auto-scroll viewport when autoScroll is enabled', () => {
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

      const initialViewport = chart.getViewport();

      // autoScroll: true로 포인트 추가 (viewport 범위 밖)
      chart.addPoints([{ x: 100, y: 50 }], { autoScroll: true });

      const newViewport = chart.getViewport();

      // 뷰포트가 변경되어야 함 (새 포인트를 포함하도록)
      expect(newViewport.xMax).toBeGreaterThan(initialViewport.xMax);
    });

    it('should maintain viewport when autoScroll is disabled', () => {
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

      const initialViewport = chart.getViewport();

      // autoScroll: false로 포인트 추가
      chart.addPoints([{ x: 100, y: 50 }], { autoScroll: false });

      const newViewport = chart.getViewport();

      // 뷰포트가 변경되지 않아야 함
      expect(newViewport).toEqual(initialViewport);
    });
  });

  describe('performance', () => {
    it('should handle large batch of points efficiently', () => {
      const initialDataset: Dataset = {
        points: [{ x: 0, y: 10 }],
      };

      const config: Partial<ChartConfig> = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const chart = createChart(container, initialDataset, config);

      // 1000개 포인트 생성
      const newPoints = Array.from({ length: 1000 }, (_, i) => ({
        x: i + 1,
        y: Math.random() * 100,
      }));

      const start = performance.now();
      chart.addPoints(newPoints, { autoRender: false });
      const duration = performance.now() - start;

      // 1000개 포인트 추가가 50ms 이내여야 함
      expect(duration).toBeLessThan(50);

      // 데이터 확인
      const state = chart.getState();
      expect(state.dataset?.points).toHaveLength(1001);
    });

    it('should handle continuous updates', () => {
      const initialDataset: Dataset = {
        points: [{ x: 0, y: 10 }],
      };

      const config: Partial<ChartConfig> = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const chart = createChart(container, initialDataset, config);

      // 100회 연속 업데이트
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        chart.addPoints([{ x: i + 1, y: Math.random() * 100 }], {
          autoRender: false,
        });
      }
      const duration = performance.now() - start;

      // 100회 업데이트가 100ms 이내여야 함
      expect(duration).toBeLessThan(100);

      // 데이터 확인
      const state = chart.getState();
      expect(state.dataset?.points).toHaveLength(101);
    });
  });
});
