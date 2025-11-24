/**
 * 선 그래프 차트 구현
 * @module charts/line
 */

import type { DataPoint, Viewport } from '../types/index';
import { virtualizeDataset } from '../utils/virtualization';
import { isLowPerformanceDevice } from '../utils/device-detection';

/**
 * 선 그래프 렌더링 옵션
 */
export interface LineChartOptions {
  /** 선 색상 */
  color?: string;
  /** 선 두께 */
  lineWidth?: number;
  /** 포인트 표시 여부 */
  showPoints?: boolean;
  /** 포인트 반경 */
  pointRadius?: number;
  /** 가상화 비활성화 여부 (기본: false) */
  disableVirtualization?: boolean;
  /** 카테고리 인덱스 매핑 (multi-series 지원) */
  categoryMap?: Map<string, number>;
}

/**
 * 선 그래프 렌더링 함수
 * 대용량 데이터셋을 자동으로 가상화하여 성능을 최적화합니다.
 *
 * @param ctx - Canvas 2D 컨텍스트
 * @param points - 데이터 포인트 배열
 * @param viewport - 뷰포트 정보
 * @param width - Canvas 너비
 * @param height - Canvas 높이
 * @param options - 렌더링 옵션
 */
export function renderLineChart(
  ctx: CanvasRenderingContext2D,
  points: DataPoint[],
  viewport: Viewport,
  width: number,
  height: number,
  options: LineChartOptions = {}
): void {
  if (points.length === 0) {
    return;
  }

  const color = options.color ?? '#3366ff';
  const lineWidth = options.lineWidth ?? 2;
  const showPoints = options.showPoints ?? false;
  const pointRadius = options.pointRadius ?? 3;
  const disableVirtualization = options.disableVirtualization ?? false;
  const categoryMap = options.categoryMap;

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

  // 선 그리기
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();

  for (let i = 0; i < renderPoints.length; i++) {
    const point = renderPoints[i];

    // X 값 처리: 숫자, Date, 또는 카테고리(문자열)
    let x: number;
    if (typeof point.x === 'number') {
      x = point.x;
    } else if (point.x instanceof Date) {
      x = point.x.getTime();
    } else {
      // 카테고리형 데이터: categoryMap이 있으면 사용, 없으면 인덱스 사용
      const numericValue = Number.parseFloat(String(point.x));
      if (!Number.isNaN(numericValue)) {
        x = numericValue;
      } else if (categoryMap && typeof point.x === 'string') {
        x = categoryMap.get(point.x) ?? i;
      } else {
        x = i;
      }
    }

    const y = point.y;

    if (Number.isNaN(y)) {
      continue;
    }

    const canvasX = ((x - viewport.xMin) / xRange) * width;
    const canvasY = height - ((y - viewport.yMin) / yRange) * height;

    if (i === 0) {
      ctx.moveTo(canvasX, canvasY);
    } else {
      ctx.lineTo(canvasX, canvasY);
    }
  }

  ctx.stroke();

  // 포인트 표시
  if (showPoints) {
    ctx.fillStyle = color;
    for (let i = 0; i < renderPoints.length; i++) {
      const point = renderPoints[i];

      // X 값 처리: 숫자, Date, 또는 카테고리(문자열)
      let x: number;
      if (typeof point.x === 'number') {
        x = point.x;
      } else if (point.x instanceof Date) {
        x = point.x.getTime();
      } else {
        // 카테고리형 데이터: categoryMap이 있으면 사용, 없으면 인덱스 사용
        const numericValue = Number.parseFloat(String(point.x));
        if (!Number.isNaN(numericValue)) {
          x = numericValue;
        } else if (categoryMap && typeof point.x === 'string') {
          x = categoryMap.get(point.x) ?? i;
        } else {
          x = i;
        }
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
  }
}
