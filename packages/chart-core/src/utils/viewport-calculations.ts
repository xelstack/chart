/**
 * 뷰포트 계산 유틸리티
 * 뷰포트 관련 계산을 수행하는 순수 함수들
 * @module utils/viewport-calculations
 */

import type { Viewport, DataPoint } from '../types/index';
import { pipe } from './fp/pipe';

/**
 * 데이터셋으로부터 뷰포트 계산
 * @param points 데이터 포인트 배열
 * @param padding 여백 비율 (기본값: 0.1 = 10%)
 * @returns 계산된 뷰포트
 */
export function calculateViewportFromDataset(points: DataPoint[], padding = 0.1): Viewport {
  if (points.length === 0) {
    return {
      xMin: 0,
      xMax: 100,
      yMin: 0,
      yMax: 100,
      zoomLevel: 1.0,
    };
  }

  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

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

    if (!Number.isNaN(y)) {
      xMin = Math.min(xMin, x);
      xMax = Math.max(xMax, x);
      yMin = Math.min(yMin, y);
      yMax = Math.max(yMax, y);
    }
  }

  // 범위가 0인 경우 기본값 사용
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  if (!Number.isFinite(xRange) || xRange === 0) {
    const centerX = Number.isFinite(xMin) ? xMin : 0;
    xMin = centerX - 50;
    xMax = centerX + 50;
  }

  if (!Number.isFinite(yRange) || yRange === 0) {
    const centerY = Number.isFinite(yMin) ? yMin : 0;
    yMin = centerY - 50;
    yMax = centerY + 50;
  }

  // 여백 추가
  const xPadding = (xMax - xMin) * padding;
  const yPadding = (yMax - yMin) * padding;

  return {
    xMin: xMin - xPadding,
    xMax: xMax + xPadding,
    yMin: yMin - yPadding,
    yMax: yMax + yPadding,
    zoomLevel: 1.0,
  };
}

/**
 * 뷰포트 확대/축소 계산
 * @param viewport 현재 뷰포트
 * @param factor 확대/축소 배율 (1.0보다 크면 확대, 작으면 축소)
 * @param centerX 중심 X 좌표 (선택, 기본값: 뷰포트 중심)
 * @param centerY 중심 Y 좌표 (선택, 기본값: 뷰포트 중심)
 * @returns 확대/축소된 뷰포트
 */
export function calculateZoomedViewport(
  viewport: Viewport,
  factor: number,
  centerX?: number,
  centerY?: number
): Viewport {
  const cx = centerX ?? (viewport.xMin + viewport.xMax) / 2;
  const cy = centerY ?? (viewport.yMin + viewport.yMax) / 2;

  const xRange = viewport.xMax - viewport.xMin;
  const yRange = viewport.yMax - viewport.yMin;

  const newXRange = xRange / factor;
  const newYRange = yRange / factor;

  return {
    xMin: cx - newXRange / 2,
    xMax: cx + newXRange / 2,
    yMin: cy - newYRange / 2,
    yMax: cy + newYRange / 2,
    zoomLevel: viewport.zoomLevel * factor,
  };
}

/**
 * 뷰포트 이동 계산
 * @param viewport 현재 뷰포트
 * @param deltaX X축 이동 거리
 * @param deltaY Y축 이동 거리
 * @returns 이동된 뷰포트
 */
export function calculatePannedViewport(
  viewport: Viewport,
  deltaX: number,
  deltaY: number
): Viewport {
  return {
    xMin: viewport.xMin + deltaX,
    xMax: viewport.xMax + deltaX,
    yMin: viewport.yMin + deltaY,
    yMax: viewport.yMax + deltaY,
    zoomLevel: viewport.zoomLevel,
  };
}

/**
 * 뷰포트를 새 포인트를 포함하도록 자동 스크롤
 * @param currentViewport 현재 뷰포트
 * @param newPoints 새로 추가된 포인트들
 * @returns 업데이트된 뷰포트
 */
export function calculateAutoScrollViewport(
  currentViewport: Viewport,
  newPoints: DataPoint[]
): Viewport {
  if (newPoints.length === 0) {
    return currentViewport;
  }

  // 새 포인트들의 x, y 범위 계산
  let maxX = -Infinity;
  let maxY = -Infinity;
  let minY = Infinity;

  for (let i = 0; i < newPoints.length; i++) {
    const point = newPoints[i];

    // X 값 처리
    let x: number;
    if (typeof point.x === 'number') {
      x = point.x;
    } else if (point.x instanceof Date) {
      x = point.x.getTime();
    } else {
      const numericValue = Number.parseFloat(String(point.x));
      x = Number.isNaN(numericValue) ? 0 : numericValue;
    }

    const y = point.y;

    if (!Number.isNaN(y)) {
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      minY = Math.min(minY, y);
    }
  }

  // 새 포인트가 현재 뷰포트 밖에 있으면 스크롤
  if (maxX > currentViewport.xMax) {
    const xRange = currentViewport.xMax - currentViewport.xMin;
    return {
      ...currentViewport,
      xMin: maxX - xRange,
      xMax: maxX,
      // Y축도 새 데이터를 포함하도록 확장
      yMin: Math.min(currentViewport.yMin, minY),
      yMax: Math.max(currentViewport.yMax, maxY),
    };
  }

  // Y축만 확장이 필요한 경우
  if (maxY > currentViewport.yMax || minY < currentViewport.yMin) {
    return {
      ...currentViewport,
      yMin: Math.min(currentViewport.yMin, minY),
      yMax: Math.max(currentViewport.yMax, maxY),
    };
  }

  return currentViewport;
}

/**
 * 뷰포트 변환 파이프라인 예제
 * pipe를 사용하여 여러 뷰포트 변환 함수를 합성합니다.
 *
 * @example
 * ```typescript
 * const transformViewport = createViewportPipeline(2.0, 50, 30);
 * const newViewport = transformViewport(initialViewport);
 * // 먼저 확대하고, 그 다음 이동합니다.
 * ```
 */
export function createViewportPipeline(
  zoomFactor: number,
  panDeltaX: number,
  panDeltaY: number
): (viewport: Viewport) => Viewport {
  // 타입 안전성을 위해 명시적 타입 정의 사용
  const zoomTransform = (viewport: Viewport): Viewport =>
    calculateZoomedViewport(viewport, zoomFactor);
  const panTransform = (viewport: Viewport): Viewport =>
    calculatePannedViewport(viewport, panDeltaX, panDeltaY);

  return pipe(zoomTransform, panTransform);
}
