import type { ChartState } from '../types/index';
import {
  createChartState,
  setStatus,
  setPointCount,
  setLastRenderTime,
  setError,
  clearError,
} from './chart-state';

/**
 * 초기화 상태로 전환합니다.
 */
export function transitionToInitializing(pointCount: number): ChartState {
  return createChartState('initializing', pointCount);
}

/**
 * 준비 상태로 전환합니다.
 */
export function transitionToReady(state: ChartState): ChartState {
  return clearError(setStatus(state, 'ready'));
}

/**
 * 렌더링 상태로 전환합니다.
 */
export function transitionToRendering(state: ChartState): ChartState {
  return clearError(setStatus(state, 'rendering'));
}

/**
 * 업데이트 중 상태로 전환합니다. 필요한 경우 포인트 개수를 갱신합니다.
 */
export function transitionToUpdating(state: ChartState, pointCount?: number): ChartState {
  const updatedStatus = clearError(setStatus(state, 'updating'));
  return pointCount !== undefined ? setPointCount(updatedStatus, pointCount) : updatedStatus;
}

/**
 * 오류 상태로 전환하고 에러 메시지를 설정합니다.
 */
export function transitionToError(state: ChartState, errorMessage: string): ChartState {
  const withStatus = setStatus(state, 'error');
  return setError(withStatus, errorMessage);
}

/**
 * 렌더링을 완료하고 마지막 렌더링 시간과 함께 준비 상태로 전환합니다.
 */
export function completeRender(state: ChartState, lastRenderTime: number): ChartState {
  const readyState = transitionToReady(state);
  return setLastRenderTime(readyState, lastRenderTime);
}
