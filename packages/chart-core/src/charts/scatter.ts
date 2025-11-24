/**
 * 산점도 차트 구현
 * @module charts/scatter
 */

import type { DataPoint, Viewport } from '../types/index';
import { virtualizeDataset } from '../utils/virtualization';
import { isLowPerformanceDevice } from '../utils/device-detection';

/**
 * 산점도 렌더링 옵션
 */
export interface ScatterChartOptions {
  /** 포인트 색상 */
  color?: string;
  /** 포인트 반경 */
  pointRadius?: number;
  /** 포인트 투명도 */
  opacity?: number;
  /** 가상화 비활성화 여부 (기본: false) */
  disableVirtualization?: boolean;
}

/**
 * 산점도 렌더링 함수
 *
 * @param ctx - Canvas 2D 컨텍스트
 * @param points - 데이터 포인트 배열
 * @param viewport - 뷰포트 정보
 * @param width - Canvas 너비
 * @param height - Canvas 높이
 * @param options - 렌더링 옵션
 */
export function renderScatterChart(
  ctx: CanvasRenderingContext2D,
  points: DataPoint[],
  viewport: Viewport,
  width: number,
  height: number,
  options: ScatterChartOptions = {}
): void {
  if (points.length === 0) {
    return;
  }

  const color = options.color ?? '#3366ff';
  const pointRadius = options.pointRadius ?? 3;
  const opacity = options.opacity ?? 1.0;
  const disableVirtualization = options.disableVirtualization ?? false;

  // 가상화 적용: 대용량 데이터셋 최적화
  // 저사양 디바이스에서는 더 적극적으로 가상화
  let renderPoints = points;
  if (!disableVirtualization && points.length > 1000) {
    const maxVisiblePoints = isLowPerformanceDevice() ? 500 : 1000;
    const virtualized = virtualizeDataset(points, viewport, maxVisiblePoints);
    renderPoints = virtualized.visiblePoints;
  }

  const xRange = viewport.xMax - viewport.xMin;
  const yRange = viewport.yMax - viewport.yMin;

  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;

  for (let i = 0; i < renderPoints.length; i++) {
    const point = renderPoints[i];

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

    ctx.beginPath();
    ctx.arc(canvasX, canvasY, pointRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1.0;
}

