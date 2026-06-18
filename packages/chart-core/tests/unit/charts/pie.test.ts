/**
 * @vitest-environment jsdom
 * 원형 그래프 렌더링 회귀 테스트 (B7 innerRadius 클램프)
 */
import { describe, it, expect, vi } from 'vitest';
import { renderPieChart } from '../../../src/charts/pie';
import type { DataPoint } from '../../../src/types/index';

function makeCtx(arcRadii: number[]): CanvasRenderingContext2D {
  return {
    beginPath: vi.fn(),
    arc: vi.fn((_cx: number, _cy: number, r: number) => {
      arcRadii.push(r);
    }),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D;
}

const points: DataPoint[] = [
  { x: 'a', y: 10 },
  { x: 'b', y: 20 },
];

describe('renderPieChart (regression)', () => {
  it('innerRadius >= outerRadius이면 내부 반지름을 outerRadius 미만으로 클램프해야 함', () => {
    const arcRadii: number[] = [];
    const ctx = makeCtx(arcRadii);

    // 120x120 캔버스 -> 자동 outerRadius = min(120,120)/2 - 20 = 40
    // innerRadius 60(>outer)을 넘겨도 어떤 arc 반지름도 outerRadius(40)을 넘으면 안 됨
    renderPieChart(ctx, points, 120, 120, { innerRadius: 60 });

    expect(arcRadii.length).toBeGreaterThan(0);
    arcRadii.forEach((r) => expect(r).toBeLessThanOrEqual(40));
    // inner arc가 outer보다 작아야 함 (60으로 그려지지 않음)
    expect(Math.max(...arcRadii)).toBeLessThanOrEqual(40);
  });

  it('음수 innerRadius는 0으로 정규화되어 풀 파이(중심으로 lineTo)가 되어야 함', () => {
    const arcRadii: number[] = [];
    const ctx = makeCtx(arcRadii);

    renderPieChart(ctx, points, 200, 200, { innerRadius: -50 });

    // innerRadius가 0으로 클램프되면 inner arc 대신 중심으로 lineTo
    expect(ctx.lineTo).toHaveBeenCalled();
  });
});
