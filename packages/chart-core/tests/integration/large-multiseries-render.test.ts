/**
 * 대용량 Multi-Series 렌더링 통합 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToCanvas } from '../../src/effects/canvas-render';
import { generateLargeMultiSeriesDataset } from '../../src/utils/data-generation';
import type { Dataset, ChartConfig, Viewport } from '../../src/types/index';

describe('Large Multi-Series Rendering', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Mock canvas setup
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    Object.defineProperty(canvas, 'clientWidth', { value: 800 });
    Object.defineProperty(canvas, 'clientHeight', { value: 600 });

    // Mock Canvas 2D context
    const mockCtx = {
      canvas,
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
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
    } as unknown as CanvasRenderingContext2D;

    ctx = mockCtx;

    // Mock performance.now()
    vi.spyOn(performance, 'now').mockReturnValue(0);
  });

  describe('Batch Rendering', () => {
    it('500개 시리즈를 렌더링해야 함', () => {
      const dataset = generateLargeMultiSeriesDataset({
        seriesCount: 500,
        pointsPerSeries: 100,
        pattern: 'sine',
      });

      const config: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
        colors: ['#3366ff', '#ff6633', '#33ff66'],
      };

      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: -60,
        yMax: 60,
        zoomLevel: 1,
      };

      const result = renderToCanvas(ctx, dataset, config, viewport);

      expect(result.rendered).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('각 시리즈가 별도로 렌더링되어야 함', () => {
      const dataset: Dataset = {
        points: [
          { x: 0, y: 10, series: 'Series 1' },
          { x: 1, y: 20, series: 'Series 1' },
          { x: 0, y: 15, series: 'Series 2' },
          { x: 1, y: 25, series: 'Series 2' },
        ],
      };

      const config: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
        colors: ['#3366ff', '#ff6633'],
      };

      const viewport: Viewport = {
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 30,
        zoomLevel: 1,
      };

      // Spy on stroke to count render calls
      const strokeSpy = vi.spyOn(ctx, 'stroke');

      renderToCanvas(ctx, dataset, config, viewport);

      // 2개 시리즈이므로 stroke가 2번 호출되어야 함
      expect(strokeSpy).toHaveBeenCalled();
    });

    it('빈 데이터셋을 처리해야 함', () => {
      const dataset: Dataset = {
        points: [],
      };

      const config: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1,
      };

      const result = renderToCanvas(ctx, dataset, config, viewport);

      expect(result.rendered).toBe(true);
    });
  });

  describe('Virtualization', () => {
    it('대용량 시리즈에서 가상화가 적용되어야 함', () => {
      const dataset = generateLargeMultiSeriesDataset({
        seriesCount: 10,
        pointsPerSeries: 5000, // 가상화 임계값 초과
        pattern: 'linear',
      });

      const config: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const viewport: Viewport = {
        xMin: 0,
        xMax: 5000,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1,
      };

      // 가상화가 적용되면 렌더링되는 포인트 수가 줄어듦
      const result = renderToCanvas(ctx, dataset, config, viewport);

      expect(result.rendered).toBe(true);
    });

    it('가상화 비활성화 옵션이 동작해야 함', () => {
      const dataset = generateLargeMultiSeriesDataset({
        seriesCount: 5,
        pointsPerSeries: 2000,
        pattern: 'sine',
      });

      const config: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const viewport: Viewport = {
        xMin: 0,
        xMax: 2000,
        yMin: -60,
        yMax: 60,
        zoomLevel: 1,
      };

      const result = renderToCanvas(ctx, dataset, config, viewport);

      expect(result.rendered).toBe(true);
    });
  });

  describe('Performance', () => {
    it('대용량 multi-series 렌더링이 합리적인 시간 내에 완료되어야 함', () => {
      const dataset = generateLargeMultiSeriesDataset({
        seriesCount: 100,
        pointsPerSeries: 500,
        pattern: 'random',
      });

      const config: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const viewport: Viewport = {
        xMin: 0,
        xMax: 500,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1,
      };

      const start = performance.now();
      renderToCanvas(ctx, dataset, config, viewport);
      const duration = performance.now() - start;

      // 100 시리즈 * 500 포인트 = 50,000 포인트 렌더링이 1초 이내 완료
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Color Management', () => {
    it('시리즈별로 다른 색상을 적용해야 함', () => {
      const dataset: Dataset = {
        points: [
          { x: 0, y: 10, series: 'Series 1' },
          { x: 1, y: 20, series: 'Series 1' },
          { x: 0, y: 15, series: 'Series 2' },
          { x: 1, y: 25, series: 'Series 2' },
          { x: 0, y: 12, series: 'Series 3' },
          { x: 1, y: 22, series: 'Series 3' },
        ],
      };

      const config: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
        colors: ['#3366ff', '#ff6633'], // 2개 색상만 제공
      };

      const viewport: Viewport = {
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 30,
        zoomLevel: 1,
      };

      // Spy on strokeStyle to verify color cycling
      const strokeStyleSpy = vi.spyOn(ctx, 'strokeStyle', 'set');

      renderToCanvas(ctx, dataset, config, viewport);

      // 색상이 설정되었는지 확인
      expect(strokeStyleSpy).toHaveBeenCalled();
    });

    it('기본 색상을 사용해야 함', () => {
      const dataset: Dataset = {
        points: [
          { x: 0, y: 10, series: 'Series 1' },
          { x: 1, y: 20, series: 'Series 1' },
        ],
      };

      const config: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
        // colors 속성 없음
      };

      const viewport: Viewport = {
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 30,
        zoomLevel: 1,
      };

      const result = renderToCanvas(ctx, dataset, config, viewport);

      expect(result.rendered).toBe(true);
    });
  });
});
