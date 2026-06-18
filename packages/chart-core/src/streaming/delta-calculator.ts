/**
 * 델타 계산기
 * currentData와 nextData를 비교하여 변경된 부분만 찾아냅니다.
 * @module streaming/delta-calculator
 */

import type { DataPoint } from '@chart/types/index';
import type { DeltaResult, CalculateDeltaOptions } from './types';

/**
 * 두 데이터 포인트가 동일한지 비교합니다.
 * @param a 첫 번째 데이터 포인트
 * @param b 두 번째 데이터 포인트
 * @returns 동일 여부
 */
function arePointsEqual(a: DataPoint, b: DataPoint): boolean {
  return a.x === b.x && a.y === b.y && a.series === b.series;
}

/**
 * 배열의 시작 부분이 동일한지 빠르게 확인합니다. (O(1) 판단)
 * @param current 현재 데이터
 * @param next 다음 데이터
 * @returns 시작 부분이 동일하면 true
 */
function hasCommonPrefix(
  current: readonly DataPoint[],
  next: readonly DataPoint[]
): boolean {
  if (current.length === 0 || next.length === 0) {
    return false;
  }
  // 첫 번째 요소만 비교하여 빠르게 판단
  return arePointsEqual(current[0], next[0]);
}

/**
 * 배열의 끝 부분이 동일한지 빠르게 확인합니다. (O(1) 판단)
 * @param current 현재 데이터
 * @param next 다음 데이터
 * @returns 끝 부분이 동일하면 true
 */
function hasCommonSuffix(
  current: readonly DataPoint[],
  next: readonly DataPoint[]
): boolean {
  if (current.length === 0 || next.length === 0) {
    return false;
  }
  // 마지막 요소만 비교하여 빠르게 판단
  return arePointsEqual(
    current[current.length - 1],
    next[next.length - 1]
  );
}

/**
 * append 케이스인지 확인합니다.
 * next가 current로 시작하고 추가 데이터가 있는 경우
 * @param current 현재 데이터
 * @param next 다음 데이터
 * @returns append 케이스이면 추가된 포인트들, 아니면 null
 */
function checkAppendCase(
  current: readonly DataPoint[],
  next: readonly DataPoint[]
): readonly DataPoint[] | null {
  // next가 current보다 길어야 함
  if (next.length <= current.length) {
    return null;
  }

  // current가 비어있으면 전체가 append
  if (current.length === 0) {
    return next;
  }

  // 시작이 같은지 빠르게 확인 (O(1))
  if (!hasCommonPrefix(current, next)) {
    return null;
  }

  // current 전체가 next의 prefix인지 확인
  for (let i = 0; i < current.length; i++) {
    if (!arePointsEqual(current[i], next[i])) {
      return null;
    }
  }

  // append된 포인트 반환
  return next.slice(current.length);
}

/**
 * prepend 케이스인지 확인합니다.
 * next가 current로 끝나고 앞에 추가 데이터가 있는 경우
 * @param current 현재 데이터
 * @param next 다음 데이터
 * @returns prepend 케이스이면 추가된 포인트들, 아니면 null
 */
function checkPrependCase(
  current: readonly DataPoint[],
  next: readonly DataPoint[]
): readonly DataPoint[] | null {
  // next가 current보다 길어야 함
  if (next.length <= current.length) {
    return null;
  }

  // current가 비어있으면 전체가 prepend (append와 동일)
  if (current.length === 0) {
    return next;
  }

  // 끝이 같은지 빠르게 확인 (O(1))
  if (!hasCommonSuffix(current, next)) {
    return null;
  }

  const prependedCount = next.length - current.length;

  // current 전체가 next의 suffix인지 확인
  for (let i = 0; i < current.length; i++) {
    if (!arePointsEqual(current[i], next[prependedCount + i])) {
      return null;
    }
  }

  // prepend된 포인트 반환
  return next.slice(0, prependedCount);
}

/**
 * 두 데이터 배열이 완전히 동일한지 확인합니다.
 * @param current 현재 데이터
 * @param next 다음 데이터
 * @returns 완전히 동일하면 true
 */
function areArraysEqual(
  current: readonly DataPoint[],
  next: readonly DataPoint[]
): boolean {
  if (current.length !== next.length) {
    return false;
  }

  for (let i = 0; i < current.length; i++) {
    if (!arePointsEqual(current[i], next[i])) {
      return false;
    }
  }

  return true;
}

/**
 * currentData와 nextData를 비교하여 델타를 계산합니다.
 *
 * 빠른 경로:
 * - append: next가 current로 시작하고 뒤에 새 데이터 추가 (가장 일반적인 실시간 케이스)
 * - prepend: next가 current로 끝나고 앞에 새 데이터 추가
 * - none: 데이터가 완전히 동일
 *
 * 느린 경로:
 * - replace: 위 케이스에 해당하지 않으면 전체 교체
 *
 * @param current 현재 데이터
 * @param next 다음 데이터
 * @param options 계산 옵션
 * @returns 델타 결과
 */
export function calculateDelta(
  current: readonly DataPoint[],
  next: readonly DataPoint[],
  options: CalculateDeltaOptions = {}
): DeltaResult {
  const { skipPrependCheck = false } = options;

  // 빈 데이터 처리
  if (next.length === 0) {
    if (current.length === 0) {
      return { type: 'none' };
    }
    // 모든 데이터 삭제 -> replace로 처리
    return { type: 'replace', points: [] };
  }

  if (current.length === 0) {
    // 현재 데이터가 없으면 전체가 append
    return { type: 'append', newPoints: next };
  }

  // 빠른 경로 1: append 케이스 확인 (가장 일반적인 실시간 케이스)
  const appendedPoints = checkAppendCase(current, next);
  if (appendedPoints !== null) {
    if (appendedPoints.length === 0) {
      return { type: 'none' };
    }
    return { type: 'append', newPoints: appendedPoints };
  }

  // 빠른 경로 2: prepend 케이스 확인 (옵션으로 스킵 가능)
  if (!skipPrependCheck) {
    const prependedPoints = checkPrependCase(current, next);
    if (prependedPoints !== null) {
      if (prependedPoints.length === 0) {
        return { type: 'none' };
      }
      return { type: 'prepend', newPoints: prependedPoints };
    }
  }

  // 빠른 경로 3: 완전히 동일한지 확인
  if (areArraysEqual(current, next)) {
    return { type: 'none' };
  }

  // 느린 경로: 전체 교체
  return { type: 'replace', points: next };
}

/**
 * DeltaCalculator 인스턴스를 생성합니다.
 * 이전 데이터를 내부적으로 유지하여 연속적인 비교를 효율적으로 수행합니다.
 */
export interface DeltaCalculator {
  /**
   * 다음 데이터와 비교하여 델타를 계산합니다.
   * @param nextData 다음 데이터
   * @returns 델타 결과
   */
  calculate(nextData: readonly DataPoint[]): DeltaResult;

  /**
   * 현재 데이터를 직접 설정합니다.
   * @param data 새로운 현재 데이터
   */
  setCurrent(data: readonly DataPoint[]): void;

  /**
   * 현재 데이터를 반환합니다.
   */
  getCurrent(): readonly DataPoint[];

  /**
   * 상태를 초기화합니다.
   */
  clear(): void;
}

/**
 * DeltaCalculator 생성 옵션
 */
export interface CreateDeltaCalculatorOptions {
  /** 초기 데이터 */
  initialData?: readonly DataPoint[];
  /** prepend 체크 스킵 여부 (성능 최적화) */
  skipPrependCheck?: boolean;
}

/**
 * DeltaCalculator 인스턴스를 생성합니다.
 * @param options 생성 옵션
 * @returns DeltaCalculator 인스턴스
 */
export function createDeltaCalculator(
  options: CreateDeltaCalculatorOptions = {}
): DeltaCalculator {
  let current: DataPoint[] = options.initialData ? [...options.initialData] : [];
  const skipPrependCheck = options.skipPrependCheck ?? false;

  return {
    calculate(nextData: readonly DataPoint[]): DeltaResult {
      const delta = calculateDelta(current, nextData, { skipPrependCheck });

      // 델타 계산 후 현재 데이터 업데이트
      if (delta.type !== 'none') {
        current = [...nextData];
      }

      return delta;
    },

    setCurrent(data: readonly DataPoint[]): void {
      current = [...data];
    },

    getCurrent(): readonly DataPoint[] {
      return current;
    },

    clear(): void {
      current = [];
    },
  };
}
