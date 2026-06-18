import type { ChartState, ChartStatus } from '@chart/types/index';

type ChartStateOverrides = Partial<Omit<ChartState, 'status' | 'pointCount'>>;

/**
 * 차트 상태를 생성합니다.
 * @param status 차트 상태
 * @param pointCount 데이터 포인트 개수
 * @param overrides 추가 속성 (optional)
 */
export function createChartState(
  status: ChartStatus,
  pointCount: number,
  overrides: ChartStateOverrides = {}
): ChartState {
  return {
    status,
    pointCount,
    ...overrides,
  };
}

/**
 * 상태를 변경합니다. 오류 상태가 아니면 에러 메시지를 초기화합니다.
 */
export function setStatus(state: ChartState, status: ChartStatus): ChartState {
  return {
    ...state,
    status,
    error: status === 'error' ? state.error : undefined,
  };
}

/**
 * 포인트 개수를 업데이트합니다.
 */
export function setPointCount(state: ChartState, pointCount: number): ChartState {
  return {
    ...state,
    pointCount,
  };
}

/**
 * 마지막 렌더링 시간을 업데이트합니다.
 */
export function setLastRenderTime(state: ChartState, lastRenderTime: number): ChartState {
  return {
    ...state,
    lastRenderTime,
  };
}

/**
 * 에러 메시지를 설정합니다.
 */
export function setError(state: ChartState, error: string): ChartState {
  return {
    ...state,
    error,
  };
}

/**
 * 에러 메시지를 제거합니다.
 */
export function clearError(state: ChartState): ChartState {
  if (state.error === undefined) {
    return { ...state, error: undefined };
  }

  return {
    ...state,
    error: undefined,
  };
}
