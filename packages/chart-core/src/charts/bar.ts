/**
 * 막대 그래프 차트 구현
 * @module charts/bar
 */

import type { DataPoint, Viewport } from '../types/index';

/**
 * 막대 그래프 렌더링 옵션
 */
export interface BarChartOptions {
  /** 막대 색상 */
  color?: string;
  /** 막대 너비 비율 (0-1) */
  barWidth?: number;
  /** 막대 간격 비율 (0-1) */
  barSpacing?: number;
}

/**
 * 막대 그래프 렌더링 함수
 *
 * @param ctx - Canvas 2D 컨텍스트
 * @param points - 데이터 포인트 배열
 * @param viewport - 뷰포트 정보
 * @param width - Canvas 너비
 * @param height - Canvas 높이
 * @param options - 렌더링 옵션
 */
export function renderBarChart(
  ctx: CanvasRenderingContext2D,
  points: DataPoint[],
  viewport: Viewport,
  width: number,
  height: number,
  options: BarChartOptions = {}
): void {
  if (points.length === 0) {
    return;
  }

  const color = options.color ?? '#3366ff';
  const barWidth = options.barWidth ?? 0.8;
  const barSpacing = options.barSpacing ?? 0.1;

  const xRange = viewport.xMax - viewport.xMin;
  const yRange = viewport.yMax - viewport.yMin;
  const zeroY = height - ((0 - viewport.yMin) / yRange) * height;

  // 막대 너비 계산
  const totalBarWidth = width / points.length;
  const barWidthPx = totalBarWidth * barWidth;
  const barSpacingPx = totalBarWidth * barSpacing;

  ctx.fillStyle = color;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    // X 값 처리: 숫자, Date, 또는 카테고리(문자열)
    let x: number;
    if (typeof point.x === 'number') {
      x = point.x;
    } else if (point.x instanceof Date) {
      x = point.x.getTime();
    } else {
      // 카테고리형 데이터: 인덱스를 사용
      const numericValue = Number.parseFloat(String(point.x));
      x = Number.isNaN(numericValue) ? i : numericValue;
    }

    const y = point.y;

    if (Number.isNaN(y)) {
      continue;
    }

    const canvasX = ((x - viewport.xMin) / xRange) * width;
    const canvasY = height - ((y - viewport.yMin) / yRange) * height;

    const barX = canvasX - barWidthPx / 2;
    const barHeight = Math.abs(canvasY - zeroY);
    const barY = y >= 0 ? zeroY - barHeight : zeroY;

    ctx.fillRect(barX + barSpacingPx / 2, barY, barWidthPx - barSpacingPx, barHeight);
  }
}
