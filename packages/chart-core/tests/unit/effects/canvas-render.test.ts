/**
 * @vitest-environment jsdom
 * canvas-render 회귀 테스트 (B8 zero-size 가드, C7 시리즈 색상 결정성)
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToCanvas, renderIncrementalToCanvas } from '../../../src/effects/canvas-render';
import type { Dataset, ChartConfig, Viewport, DataPoint } from '../../../src/types/index';

const vp: Viewport = { xMin: 0, xMax: 10, yMin: 0, yMax: 10, zoomLevel: 1.0 };

function makeCtx(extra: Partial<Record<string, unknown>> = {}): CanvasRenderingContext2D {
  return {
    canvas: { clientWidth: 0, clientHeight: 0 },
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
    ...extra,
  } as unknown as CanvasRenderingContext2D;
}

describe('renderToCanvas (regression B8)', () => {
  it('width/height가 0이면 렌더하지 않고 rendered:false를 반환해야 함', () => {
    const ctx = makeCtx();
    const result = renderToCanvas(
      ctx,
      { points: [{ x: 1, y: 2 }] },
      { type: 'line', width: 0, height: 0, title: 'T' },
      vp
    );

    expect(result.rendered).toBe(false);
    expect(ctx.clearRect).not.toHaveBeenCalled();
  });

  it('renderIncrementalToCanvas도 0 크기에서 rendered:false를 반환해야 함', () => {
    const ctx = makeCtx();
    const result = renderIncrementalToCanvas(
      ctx,
      [{ x: 1, y: 2 }],
      { type: 'line', width: 0, height: 0 },
      vp
    );

    expect(result.rendered).toBe(false);
    expect(result.pointsRendered).toBe(0);
  });
});

describe('series-to-color mapping (regression C7)', () => {
  // stroke 시점의 strokeStyle과 직전 moveTo의 y좌표를 기록 -> 시리즈별 색상 매핑 관찰
  function captureColorByY(points: DataPoint[]): Record<number, string> {
    let lastY = NaN;
    const records: { color: string; y: number }[] = [];
    const ctx = makeCtx({
      canvas: { clientWidth: 100, clientHeight: 100 },
      moveTo: vi.fn((_x: number, y: number) => {
        lastY = y;
      }),
      lineTo: vi.fn((_x: number, y: number) => {
        lastY = y;
      }),
    });
    (ctx.stroke as ReturnType<typeof vi.fn>).mockImplementation(() => {
      records.push({ color: ctx.strokeStyle as string, y: lastY });
    });

    const config: ChartConfig = {
      type: 'line',
      width: 100,
      height: 100,
      showGrid: false,
      colors: ['#aaaaaa', '#bbbbbb', '#cccccc'],
    };
    const dataset: Dataset = { points };
    renderToCanvas(ctx, dataset, config, vp);

    const map: Record<number, string> = {};
    records.forEach((r) => {
      map[r.y] = r.color;
    });
    return map;
  }

  it('시리즈 색상은 데이터 입력 순서와 무관하게 동일해야 함', () => {
    const orderBA = captureColorByY([
      { x: 0, y: 8, series: 'B' },
      { x: 0, y: 2, series: 'A' },
    ]);
    const orderAB = captureColorByY([
      { x: 0, y: 2, series: 'A' },
      { x: 0, y: 8, series: 'B' },
    ]);

    expect(orderBA).toEqual(orderAB);
  });

  it('series 없는(undefined) 버킷이 이름 있는 시리즈의 색을 밀지 않아야 함', () => {
    // y=2(series A)의 canvasY = 100 - (2/10)*100 = 80
    const aOnly = captureColorByY([{ x: 0, y: 2, series: 'A' }]);
    const aWithUnnamed = captureColorByY([
      { x: 0, y: 2, series: 'A' },
      { x: 1, y: 5 },
    ]);

    // 이름 있는 시리즈 A는 unnamed 존재 여부와 무관하게 첫 색상을 유지
    expect(aWithUnnamed[80]).toBe('#aaaaaa');
    expect(aOnly[80]).toBe('#aaaaaa');
  });
});
