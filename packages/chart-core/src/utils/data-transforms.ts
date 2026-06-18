/**
 * 데이터 변환 유틸리티
 * 데이터 포인트 배열을 변환하는 순수 함수들
 * @module utils/data-transforms
 */

import type { DataPoint } from '@chart/types/index';
import { pipe } from './fp/pipe';

/**
 * 데이터 포인트 필터링
 * @param points 데이터 포인트 배열
 * @param predicate 필터 조건 함수
 * @returns 필터링된 배열 (새로운 배열)
 */
export function filterPoints(
  points: DataPoint[],
  predicate: (point: DataPoint) => boolean
): DataPoint[] {
  return points.filter(predicate);
}

/**
 * 데이터 포인트 정렬
 * @param points 데이터 포인트 배열
 * @param compareFn 비교 함수 (선택, 기본값: X축 기준 오름차순)
 * @returns 정렬된 배열 (새로운 배열)
 */
export function sortPoints(
  points: DataPoint[],
  compareFn?: (a: DataPoint, b: DataPoint) => number
): DataPoint[] {
  const sorted = [...points];
  if (compareFn) {
    sorted.sort(compareFn);
  } else {
    sorted.sort((a, b) => {
      const xA =
        typeof a.x === 'number'
          ? a.x
          : a.x instanceof Date
            ? a.x.getTime()
            : Number.parseFloat(String(a.x));
      const xB =
        typeof b.x === 'number'
          ? b.x
          : b.x instanceof Date
            ? b.x.getTime()
            : Number.parseFloat(String(b.x));

      if (Number.isNaN(xA) || Number.isNaN(xB)) {
        return 0;
      }

      return xA - xB;
    });
  }
  return sorted;
}

/**
 * 데이터 포인트 변환
 * @param points 데이터 포인트 배열
 * @param transform 변환 함수
 * @returns 변환된 배열 (새로운 배열)
 */
export function mapPoints(
  points: DataPoint[],
  transform: (point: DataPoint) => DataPoint
): DataPoint[] {
  return points.map(transform);
}

/**
 * 함수 합성 예제: 필터링 → 정렬 → 변환 파이프라인
 * pipe를 사용하여 여러 데이터 변환 함수를 합성합니다.
 *
 * @example
 * ```typescript
 * const processData = createDataPipeline(
 *   (p) => p.y > 0,           // 필터링 조건
 *   undefined,                 // 기본 정렬 (X축 기준)
 *   (p) => ({ ...p, y: p.y * 2 }) // 변환 함수
 * );
 * const result = processData(points);
 * ```
 */
export function createDataPipeline(
  filterPredicate: (point: DataPoint) => boolean,
  sortCompareFn?: (a: DataPoint, b: DataPoint) => number,
  mapTransform?: (point: DataPoint) => DataPoint
) {
  return pipe(
    (points: DataPoint[]) => filterPoints(points, filterPredicate),
    (points: DataPoint[]) => sortPoints(points, sortCompareFn),
    (points: DataPoint[]) => (mapTransform ? mapPoints(points, mapTransform) : points)
  );
}
