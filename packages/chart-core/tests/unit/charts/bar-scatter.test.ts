/**
 * @vitest-environment jsdom
 * 막대/산점도 렌더링 회귀 테스트 (B1 zero-range, 유한성 가드)
 */
import { describe, it, expect, vi } from 'vitest';
import { renderBarChart } from '../../../src/charts/bar';
import { renderScatterChart } from '../../../src/charts/scatter';
import type { Viewport } from '../../../src/types/index';

const vp: Viewport = { xMin: 0, xMax: 10, yMin: 0, yMax: 10, zoomLevel: 1.0 };
const degenerate: Viewport = { xMin: 5, xMax: 5, yMin: 5, yMax: 5, zoomLevel: 1.0 };

describe('renderBarChart (regression)', () => {
  it('범위가 0인 뷰포트에서 fillRect에 유한한 좌표만 전달해야 함', () => {
    const fillRect = vi.fn();
    const ctx = { fillRect, fillStyle: '' } as unknown as CanvasRenderingContext2D;

    renderBarChart(ctx, [{ x: 5, y: 5 }], degenerate, 100, 100);

    fillRect.mock.calls.forEach((args) => {
      args.forEach((a) => expect(Number.isFinite(a)).toBe(true));
    });
  });

  it('유한하지 않은 y는 건너뛰어야 함', () => {
    const fillRect = vi.fn();
    const ctx = { fillRect, fillStyle: '' } as unknown as CanvasRenderingContext2D;

    renderBarChart(
      ctx,
      [
        { x: 0, y: Infinity },
        { x: 1, y: 5 },
      ],
      vp,
      100,
      100
    );

    expect(fillRect).toHaveBeenCalledTimes(1);
  });
});

describe('renderScatterChart (regression)', () => {
  it('범위가 0인 뷰포트에서 arc에 유한한 좌표만 전달해야 함', () => {
    const arc = vi.fn();
    const ctx = {
      arc,
      beginPath: vi.fn(),
      fill: vi.fn(),
      fillStyle: '',
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    renderScatterChart(ctx, [{ x: 5, y: 5 }], degenerate, 100, 100);

    arc.mock.calls.forEach(([x, y]) => {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    });
  });

  it('유한하지 않은 y는 건너뛰어야 함', () => {
    const arc = vi.fn();
    const ctx = {
      arc,
      beginPath: vi.fn(),
      fill: vi.fn(),
      fillStyle: '',
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    renderScatterChart(
      ctx,
      [
        { x: 0, y: Infinity },
        { x: 1, y: 5 },
      ],
      vp,
      100,
      100
    );

    expect(arc).toHaveBeenCalledTimes(1);
  });
});
