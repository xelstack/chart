/**
 * @vitest-environment jsdom
 * 선 그래프 렌더링 회귀 테스트 (B1 zero-range, B4 NaN/유한성 + 경로 끊기)
 */
import { describe, it, expect, vi } from 'vitest';
import { renderLineChart } from '../../../src/charts/line';
import type { Viewport, DataPoint } from '../../../src/types/index';

function makeCtx(): CanvasRenderingContext2D {
  return {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D;
}

const vp: Viewport = { xMin: 0, xMax: 10, yMin: 0, yMax: 10, zoomLevel: 1.0 };

function allCoordsFinite(ctx: CanvasRenderingContext2D): boolean {
  const calls = [
    ...(ctx.moveTo as ReturnType<typeof vi.fn>).mock.calls,
    ...(ctx.lineTo as ReturnType<typeof vi.fn>).mock.calls,
  ];
  return calls.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}

describe('renderLineChart (regression)', () => {
  it('선두 NaN: 첫 경로 연산은 lineTo가 아니라 moveTo여야 함', () => {
    const ctx = makeCtx();
    const points: DataPoint[] = [
      { x: 0, y: NaN },
      { x: 1, y: 5 },
      { x: 2, y: 6 },
    ];

    renderLineChart(ctx, points, vp, 100, 100);

    expect((ctx.moveTo as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    const moveOrder = (ctx.moveTo as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
    const lineOrder = (ctx.lineTo as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
    expect(moveOrder).toBeLessThan(lineOrder);
  });

  it('중간 NaN: 경로가 끊겨 새 subpath(moveTo)가 생겨야 함', () => {
    const ctx = makeCtx();
    const points: DataPoint[] = [
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: NaN },
      { x: 3, y: 4 },
      { x: 4, y: 5 },
    ];

    renderLineChart(ctx, points, vp, 100, 100);

    // 갭 전/후로 두 개의 subpath
    expect((ctx.moveTo as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });

  it('범위가 0인 뷰포트에서도 유한한 좌표만 전달해야 함', () => {
    const ctx = makeCtx();
    const degenerate: Viewport = { xMin: 5, xMax: 5, yMin: 5, yMax: 5, zoomLevel: 1.0 };
    const points: DataPoint[] = [
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ];

    renderLineChart(ctx, points, degenerate, 100, 100);

    expect(allCoordsFinite(ctx)).toBe(true);
  });

  it('Infinity x/y는 건너뛰고 유한한 좌표만 전달해야 함', () => {
    const ctx = makeCtx();
    const points: DataPoint[] = [
      { x: 0, y: 1 },
      { x: Infinity, y: 2 },
      { x: 2, y: Infinity },
      { x: 3, y: 4 },
    ];

    renderLineChart(ctx, points, vp, 100, 100);

    expect(allCoordsFinite(ctx)).toBe(true);
  });
});
