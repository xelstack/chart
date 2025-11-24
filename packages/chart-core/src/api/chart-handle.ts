/**
 * 차트 핸들 인터페이스
 * 함수형 API에서 차트를 관리하기 위한 핸들
 * @module api/chart-handle
 */

import type { Dataset, ChartConfig, Viewport, ChartState, DataPoint, AddPointsOptions } from '../types/index';

/**
 * 차트 핸들 인터페이스
 * 차트를 관리하기 위한 함수형 API
 */
export interface ChartHandle {
  /** 데이터셋 업데이트 */
  updateData: (dataset: Dataset) => void;
  /** 설정 업데이트 (내부적으로 mergeConfig 사용) */
  updateConfig: (config: Partial<ChartConfig>) => void;
  /** 차트 렌더링 (내부적으로 renderToCanvas 사용) */
  render: () => void;
  /** 차트 크기 변경 */
  resize: (width: number, height: number) => void;
  /** 뷰포트 리셋 (확대/이동 초기화) */
  resetViewport: () => void;
  /** 뷰포트 직접 설정 */
  setViewport: (viewport: Viewport) => void;
  /** 차트 확대/축소 */
  zoom: (factor: number, centerX?: number, centerY?: number) => void;
  /** 차트 이동 */
  pan: (deltaX: number, deltaY: number) => void;
  /** 현재 뷰포트 반환 */
  getViewport: () => Viewport;
  /** 현재 차트 상태 반환 */
  getState: () => ChartState;
  /** 실시간으로 데이터 포인트 추가 */
  addPoints: (points: DataPoint[], options?: AddPointsOptions) => void;
  /** 리소스 정리 */
  destroy: () => void;
}
