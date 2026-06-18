/**
 * 데이터 샘플링 유틸리티
 * 대용량 데이터셋을 효율적으로 렌더링하기 위한 샘플링 함수들
 * @module utils/sampling
 */

import type { DataPoint } from '@chart/types/index';

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

  // targetCount === 1: 첫 포인트를 대표로 반환 (마지막-포인트 덮어쓰기로 첫 포인트가 사라지는 버그 방지)
  if (targetCount === 1) {
    return [points[0]];
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

  const n = filteredPoints.length;

  // 필터링 후 데이터가 목표 개수 이하이면 그대로 반환
  if (n <= targetCount) {
    return [...filteredPoints];
  }

  // targetCount === 1: 첫 포인트를 대표로 반환
  if (targetCount === 1) {
    return [filteredPoints[0]];
  }

  // 데이터 밀도 계산 (변화율 기반): 변화가 큰 구간일수록 가중치가 높음
  const densities = new Array<number>(n).fill(0);
  let maxDensity = 0;
  for (let i = 1; i < n; i++) {
    const xDiff = toNumber(filteredPoints[i].x) - toNumber(filteredPoints[i - 1].x);
    const yDiff = Math.abs(filteredPoints[i].y - filteredPoints[i - 1].y);
    const density = yDiff / (Math.abs(xDiff) || 1);
    densities[i] = Number.isFinite(density) ? density : 0;
    if (densities[i] > maxDensity) {
      maxDensity = densities[i];
    }
  }

  // 가중치 = 기본 1 + 정규화된 밀도(0~1). 평탄한 구간도 최소한 샘플링되고,
  // 밀도가 높은 구간은 누적 가중치가 빠르게 커져 더 많은 샘플이 배정됨.
  const cumulative = new Array<number>(n);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const weight = 1 + (maxDensity > 0 ? densities[i] / maxDensity : 0);
    acc += weight;
    cumulative[i] = acc;
  }
  const totalWeight = acc;

  // 누적 가중치를 균등 분할하여 역-CDF 샘플링 (밀도 비례 배분)
  const sampled: DataPoint[] = [];
  let searchIndex = 0;
  for (let k = 0; k < targetCount; k++) {
    const target = ((k + 1) / targetCount) * totalWeight;
    while (searchIndex < n - 1 && cumulative[searchIndex] < target) {
      searchIndex++;
    }
    sampled.push(filteredPoints[searchIndex]);
  }

  // 첫/마지막 포인트는 항상 포함
  sampled[0] = filteredPoints[0];
  sampled[sampled.length - 1] = filteredPoints[n - 1];

  return sampled;
}

