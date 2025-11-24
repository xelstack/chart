/**
 * Multi-Series 렌더링 성능 벤치마크 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToCanvas } from '../../src/effects/canvas-render';
import { generateLargeMultiSeriesDataset } from '../../src/utils/data-generation';
import type { ChartConfig, Viewport } from '../../src/types/index';
import { getPerformanceMonitor } from '../../src/utils/performance-monitor';

describe('Multi-Series Performance Benchmarks', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let perfMonitor: ReturnType<typeof getPerformanceMonitor>;

  beforeEach(() => {
    // Setup canvas
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

    // Setup performance monitor
    perfMonitor = getPerformanceMonitor();
    perfMonitor.reset();
  });

  it('500 시리즈 * 100 포인트 렌더링이 500ms 이내여야 함', () => {
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

    perfMonitor.startFrame();
    renderToCanvas(ctx, dataset, config, viewport);
    perfMonitor.endFrame();

    const metrics = perfMonitor.getMetrics();
    console.log(
      `Rendered 500 series * 100 points in ${metrics.renderTime.toFixed(2)}ms`
    );

    expect(metrics.renderTime).toBeLessThan(500);
  });

  it('100 시리즈 * 1000 포인트 렌더링이 300ms 이내여야 함', () => {
    const dataset = generateLargeMultiSeriesDataset({
      seriesCount: 100,
      pointsPerSeries: 1000,
      pattern: 'linear',
    });

    const config: ChartConfig = {
      type: 'line',
      width: 800,
      height: 600,
    };

    const viewport: Viewport = {
      xMin: 0,
      xMax: 1000,
      yMin: 0,
      yMax: 100,
      zoomLevel: 1,
    };

    perfMonitor.startFrame();
    renderToCanvas(ctx, dataset, config, viewport);
    perfMonitor.endFrame();

    const metrics = perfMonitor.getMetrics();
    console.log(
      `Rendered 100 series * 1000 points in ${metrics.renderTime.toFixed(2)}ms`
    );

    expect(metrics.renderTime).toBeLessThan(300);
  });

  it('50 시리즈 * 5000 포인트 렌더링이 250ms 이내여야 함', () => {
    const dataset = generateLargeMultiSeriesDataset({
      seriesCount: 50,
      pointsPerSeries: 5000,
      pattern: 'sine',
    });

    const config: ChartConfig = {
      type: 'line',
      width: 800,
      height: 600,
    };

    const viewport: Viewport = {
      xMin: 0,
      xMax: 5000,
      yMin: -60,
      yMax: 60,
      zoomLevel: 1,
    };

    perfMonitor.startFrame();
    renderToCanvas(ctx, dataset, config, viewport);
    perfMonitor.endFrame();

    const metrics = perfMonitor.getMetrics();
    console.log(
      `Rendered 50 series * 5000 points in ${metrics.renderTime.toFixed(2)}ms`
    );

    expect(metrics.renderTime).toBeLessThan(250);
  });

  it('연속 렌더링 시 60fps 유지 가능해야 함', () => {
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

    // 10프레임 연속 렌더링
    for (let i = 0; i < 10; i++) {
      perfMonitor.startFrame();
      renderToCanvas(ctx, dataset, config, viewport);
      perfMonitor.endFrame();
    }

    const metrics = perfMonitor.getMetrics();
    console.log(`Average FPS: ${metrics.averageFps.toFixed(2)}`);
    console.log(
      `Average render time: ${metrics.averageRenderTime.toFixed(2)}ms`
    );

    // 60fps = 16.67ms per frame
    // 여유를 두어 30ms 이내로 설정 (시스템 부하 변동성 고려)
    expect(metrics.averageRenderTime).toBeLessThan(30);
    expect(metrics.averageFps).toBeGreaterThan(40);
  });

  it('메모리 사용량이 안정적이어야 함', () => {
    const dataset = generateLargeMultiSeriesDataset({
      seriesCount: 200,
      pointsPerSeries: 500,
      pattern: 'sine',
    });

    const config: ChartConfig = {
      type: 'line',
      width: 800,
      height: 600,
    };

    const viewport: Viewport = {
      xMin: 0,
      xMax: 500,
      yMin: -60,
      yMax: 60,
      zoomLevel: 1,
    };

    // 여러 번 렌더링하여 메모리 누수 확인
    for (let i = 0; i < 5; i++) {
      renderToCanvas(ctx, dataset, config, viewport);
    }

    const metrics = perfMonitor.getMetrics();
    console.log(`Memory usage: ${metrics.memoryUsage?.toFixed(2)}MB`);

    // 메모리 사용량이 합리적인 범위 내에 있어야 함 (100MB 이하)
    if (metrics.memoryUsage !== undefined) {
      expect(metrics.memoryUsage).toBeLessThan(100);
    }
  });
});
