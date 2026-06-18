/**
 * DataBuffer 구현
 * 현재 데이터와 대기 중인 데이터를 관리하는 버퍼
 * @module streaming/data-buffer
 */

import type { DataPoint } from '@chart/types/index';
import type {
  CreateDataBufferOptions,
  DataBuffer,
  DataBufferState,
} from './types';

/**
 * DataBuffer 생성 함수
 * @param options 생성 옵션
 * @returns DataBuffer 인스턴스
 */
export function createDataBuffer(
  options: CreateDataBufferOptions = {}
): DataBuffer {
  // 내부 상태 (mutable)
  let current: DataPoint[] = options.initialData
    ? [...options.initialData]
    : [];
  let pending: DataPoint[] = [];
  let lastRenderedIndex = current.length > 0 ? current.length - 1 : -1;
  let maxPoints: number | undefined = options.maxPoints;

  /**
   * maxPoints 초과 시 오래된 데이터 제거 (trim)
   */
  function trimToMaxPoints(): void {
    if (maxPoints === undefined) return;

    const totalCount = current.length + pending.length;
    if (totalCount <= maxPoints) return;

    const excess = totalCount - maxPoints;

    // current에서 먼저 제거
    if (current.length >= excess) {
      current = current.slice(excess);
      // lastRenderedIndex 조정
      lastRenderedIndex = Math.max(-1, lastRenderedIndex - excess);
    } else {
      // current를 모두 제거하고 pending에서 나머지 제거
      const remainingExcess = excess - current.length;
      current = [];
      pending = pending.slice(remainingExcess);
      lastRenderedIndex = -1;
    }
  }

  return {
    getCurrent(): readonly DataPoint[] {
      // 방어적 복사: 내부 배열을 직접 노출하지 않아 외부 변조를 방지
      return [...current];
    },

    getPending(): readonly DataPoint[] {
      // 방어적 복사: 내부 배열을 직접 노출하지 않아 외부 변조를 방지
      return [...pending];
    },

    addPoints(points: readonly DataPoint[]): void {
      if (points.length === 0) return;

      // pending에 추가
      pending = [...pending, ...points];

      // maxPoints 제한 적용
      trimToMaxPoints();
    },

    flush(): readonly DataPoint[] {
      if (pending.length === 0) {
        return [];
      }

      // pending을 current로 이동
      const flushed = pending;
      current = [...current, ...pending];
      pending = [];

      // lastRenderedIndex 업데이트
      lastRenderedIndex = current.length - 1;

      // maxPoints 제한 적용
      trimToMaxPoints();

      return flushed;
    },

    clear(): void {
      current = [];
      pending = [];
      lastRenderedIndex = -1;
    },

    getTotalCount(): number {
      return current.length + pending.length;
    },

    setMaxPoints(newMaxPoints: number | undefined): void {
      maxPoints = newMaxPoints;
      trimToMaxPoints();
    },

    getState(): DataBufferState {
      // 진짜 스냅샷이 되도록 배열을 복사하여 반환 (외부 변조 차단)
      return {
        current: [...current],
        pending: [...pending],
        lastRenderedIndex,
        maxPoints,
        totalCount: current.length + pending.length,
      };
    },
  };
}
