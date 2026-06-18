/**
 * 가상화 유틸리티
 * 대용량 데이터셋을 효율적으로 렌더링하기 위한 가상화 함수들
 * @module utils/virtualization
 */

import type { DataPoint, Viewport } from '@chart/types/index';

/**
 * 가상화된 데이터셋
 * 실제 렌더링에 필요한 데이터만 포함합니다.
 */
export interface VirtualizedDataset {
  /** 렌더링할 데이터 포인트 */
  visiblePoints: DataPoint[];
  /** 전체 데이터셋의 시작 인덱스 */
  startIndex: number;
  /** 전체 데이터셋의 끝 인덱스 */
  endIndex: number;
  /** 전체 데이터 포인트 개수 */
  totalCount: number;
}

/**
 * 데이터 포인트를 뷰포트에 맞게 가상화합니다.
 * 뷰포트 범위 내의 데이터만 반환하여 렌더링 성능을 최적화합니다.
 * 
 * @param points - 전체 데이터 포인트 배열
 * @param viewport - 현재 뷰포트 정보
 * @param maxVisiblePoints - 최대 표시할 포인트 개수 (기본값: 1000)
 * @returns 가상화된 데이터셋
 * 
 * @example
 * ```typescript
 * const points = Array.from({ length: 100000 }, (_, i) => ({ x: i, y: Math.random() * 100 }));
 * const viewport = { xMin: 0, xMax: 100, yMin: 0, yMax: 100, zoomLevel: 1.0 };
 * const virtualized = virtualizeDataset(points, viewport, 500);
 * // virtualized.visiblePoints는 뷰포트 내의 최대 500개 포인트만 포함
 * ```
 */
export function virtualizeDataset(
  points: DataPoint[],
  viewport: Viewport,
  maxVisiblePoints = 1000
): VirtualizedDataset {
  if (points.length === 0) {
    return {
      visiblePoints: [],
      startIndex: 0,
      endIndex: 0,
      totalCount: 0,
    };
  }

  // maxVisiblePoints 방어: 0/음수/소수/비유한 입력으로 인한 빈 결과·Infinity step 방지
  const cap = Number.isFinite(maxVisiblePoints)
    ? Math.max(1, Math.floor(maxVisiblePoints))
    : 1000;

  // 뷰포트 범위 내의 포인트 찾기
  const visibleIndices: number[] = [];
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const x = typeof point.x === 'number' 
      ? point.x 
      : point.x instanceof Date 
        ? point.x.getTime() 
        : Number.parseFloat(String(point.x));
    
    if (Number.isNaN(x) || Number.isNaN(point.y)) {
      continue;
    }

    if (x >= viewport.xMin && x <= viewport.xMax && 
        point.y >= viewport.yMin && point.y <= viewport.yMax) {
      visibleIndices.push(i);
    }
  }

  if (visibleIndices.length === 0) {
    return {
      visiblePoints: [],
      startIndex: 0,
      endIndex: 0,
      totalCount: points.length,
    };
  }

  const startIndex = visibleIndices[0];
  const endIndex = visibleIndices[visibleIndices.length - 1];

  // 최대 표시 개수 제한
  let visiblePoints: DataPoint[];
  if (visibleIndices.length <= cap) {
    visiblePoints = visibleIndices.map(i => points[i]);
  } else {
    // 균등 샘플링
    const step = visibleIndices.length / cap;
    visiblePoints = [];
    for (let i = 0; i < cap; i++) {
      const index = Math.floor(i * step);
      visiblePoints.push(points[visibleIndices[index]]);
    }
    // 마지막 포인트는 항상 포함
    visiblePoints[visiblePoints.length - 1] = points[endIndex];
  }

  return {
    visiblePoints,
    startIndex,
    endIndex,
    totalCount: points.length,
  };
}

/**
 * 데이터 포인트 배열을 청크로 나눕니다.
 * 대용량 데이터를 청크 단위로 처리하여 메모리 사용을 최적화합니다.
 * 
 * @param points - 전체 데이터 포인트 배열
 * @param chunkSize - 청크 크기 (기본값: 1000)
 * @returns 청크 배열
 */
export function chunkDataset(
  points: DataPoint[],
  chunkSize = 1000
): DataPoint[][] {
  if (points.length === 0 || chunkSize <= 0) {
    return [];
  }

  const chunks: DataPoint[][] = [];
  for (let i = 0; i < points.length; i += chunkSize) {
    chunks.push(points.slice(i, i + chunkSize));
  }

  return chunks;
}

/**
 * 가상 스크롤을 위한 데이터 범위를 계산합니다.
 * 
 * @param totalCount - 전체 데이터 개수
 * @param viewportHeight - 뷰포트 높이 (픽셀)
 * @param itemHeight - 항목 높이 (픽셀)
 * @param scrollTop - 현재 스크롤 위치 (픽셀)
 * @param overscan - 렌더링할 추가 항목 개수 (기본값: 5)
 * @returns 렌더링할 데이터 범위
 */
export function calculateVirtualRange(
  totalCount: number,
  viewportHeight: number,
  itemHeight: number,
  scrollTop: number,
  overscan = 5
): { start: number; end: number; totalHeight: number } {
  // itemHeight가 0/음수/비유한이면 나눗셈이 NaN/Infinity를 만들어 범위가 깨지므로 안전한 빈 범위 반환
  if (!Number.isFinite(itemHeight) || itemHeight <= 0 || totalCount <= 0) {
    return { start: 0, end: 0, totalHeight: 0 };
  }

  const visibleCount = Math.ceil(viewportHeight / itemHeight);
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const end = Math.min(totalCount, start + visibleCount + overscan * 2);
  const totalHeight = totalCount * itemHeight;

  return {
    start,
    end,
    totalHeight,
  };
}

