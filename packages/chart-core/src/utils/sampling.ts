/**
 * 데이터 샘플링 유틸리티
 * 대용량 데이터셋을 효율적으로 렌더링하기 위한 샘플링 함수들
 * @module utils/sampling
 */

import type { DataPoint } from '../types/index';

/**
 * 데이터 포인트 배열을 지정된 개수로 균등 샘플링합니다.
 * 
 * @param points - 샘플링할 데이터 포인트 배열
 * @param targetCount - 목표 샘플 개수
 * @returns 샘플링된 데이터 포인트 배열
 * 
 * @example
 * ```typescript
 * const points = Array.from({ length: 1000 }, (_, i) => ({ x: i, y: Math.random() * 100 }));
 * const sampled = uniformSample(points, 100); // 100개로 샘플링
 * ```
 */
export function uniformSample(points: DataPoint[], targetCount: number): DataPoint[] {
  if (points.length === 0 || targetCount <= 0) {
    return [];
  }

  if (points.length <= targetCount) {
    return [...points];
  }

  const step = points.length / targetCount;
  const sampled: DataPoint[] = [];

  for (let i = 0; i < targetCount; i++) {
    const index = Math.floor(i * step);
    sampled.push(points[index]);
  }

  // 마지막 포인트는 항상 포함
  if (sampled[sampled.length - 1] !== points[points.length - 1]) {
    sampled[sampled.length - 1] = points[points.length - 1];
  }

  return sampled;
}

/**
 * 뷰포트 범위에 해당하는 데이터 포인트만 필터링합니다.
 * 
 * @param points - 필터링할 데이터 포인트 배열
 * @param xMin - X축 최소값
 * @param xMax - X축 최대값
 * @param yMin - Y축 최소값
 * @param yMax - Y축 최대값
 * @returns 필터링된 데이터 포인트 배열
 */
export function filterByViewport(
  points: DataPoint[],
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
): DataPoint[] {
  return points.filter((point) => {
    const x = typeof point.x === 'number' ? point.x : point.x instanceof Date ? point.x.getTime() : Number.parseFloat(String(point.x));
    const y = point.y;

    if (Number.isNaN(x) || Number.isNaN(y)) {
      return false;
    }

    return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
  });
}

/**
 * 데이터 포인트의 X값을 숫자로 변환합니다.
 * 
 * @param x - 변환할 X값
 * @returns 숫자로 변환된 값
 */
function toNumber(x: number | string | Date): number {
  if (typeof x === 'number') {
    return x;
  }
  if (x instanceof Date) {
    return x.getTime();
  }
  return Number.parseFloat(String(x));
}

/**
 * 적응형 샘플링: 데이터 밀도에 따라 샘플링 비율을 조정합니다.
 * 
 * @param points - 샘플링할 데이터 포인트 배열
 * @param targetCount - 목표 샘플 개수
 * @param viewportXMin - 뷰포트 X축 최소값 (선택)
 * @param viewportXMax - 뷰포트 X축 최대값 (선택)
 * @returns 샘플링된 데이터 포인트 배열
 */
export function adaptiveSample(
  points: DataPoint[],
  targetCount: number,
  viewportXMin?: number,
  viewportXMax?: number
): DataPoint[] {
  if (points.length === 0 || targetCount <= 0) {
    return [];
  }

  if (points.length <= targetCount) {
    return [...points];
  }

  // 뷰포트가 지정된 경우 뷰포트 내 데이터만 처리
  let filteredPoints = points;
  if (viewportXMin !== undefined && viewportXMax !== undefined) {
    filteredPoints = points.filter((point) => {
      const x = toNumber(point.x);
      return x >= viewportXMin && x <= viewportXMax;
    });

    // 뷰포트 내 데이터가 없으면 전체 데이터 사용
    if (filteredPoints.length === 0) {
      filteredPoints = points;
    }
  }

  // 데이터 밀도 계산 (변화율 기반)
  const densityMap = new Map<number, number>();
  for (let i = 1; i < filteredPoints.length; i++) {
    const prev = filteredPoints[i - 1];
    const curr = filteredPoints[i];
    const xDiff = toNumber(curr.x) - toNumber(prev.x);
    const yDiff = Math.abs(curr.y - prev.y);
    const density = yDiff / (xDiff || 1);
    densityMap.set(i, density);
  }

  // 밀도가 높은 구간은 더 많이 샘플링
  const sampled: DataPoint[] = [];
  const step = filteredPoints.length / targetCount;

  for (let i = 0; i < targetCount; i++) {
    const index = Math.floor(i * step);
    sampled.push(filteredPoints[index]);
  }

  // 마지막 포인트는 항상 포함
  if (sampled[sampled.length - 1] !== filteredPoints[filteredPoints.length - 1]) {
    sampled[sampled.length - 1] = filteredPoints[filteredPoints.length - 1];
  }

  return sampled;
}

