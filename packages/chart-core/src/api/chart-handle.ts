/**
 * 차트 핸들 인터페이스
 * 함수형 API에서 차트를 관리하기 위한 핸들
 * @module api/chart-handle
 */

import type {
  Dataset,
  ChartConfig,
  Viewport,
  ChartState,
  DataPoint,
  AddPointsOptions,
} from '@chart/types/index';
import type {
  IncrementalRenderOptions,
  IncrementalRenderState,
  IncrementalAddPointsOptions,
} from '@chart/types/incremental';

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

  /**
   * 데이터 포인트 추가 (증분 렌더링)
   * 새 데이터만 렌더링하여 성능 최적화
   * @param points 추가할 데이터 포인트
   * @param options 추가 옵션
   */
  addPointsIncremental: (
    points: readonly DataPoint[],
    options?: IncrementalAddPointsOptions
  ) => void;

  /**
   * 배치 업데이트 (델타 계산 후 증분 렌더링)
   * currentData와 nextData를 비교하여 변경분만 렌더링
   * @param nextData 다음 상태의 전체 데이터
   */
  updateDataIncremental: (nextData: readonly DataPoint[]) => void;

  /**
   * 증분 렌더링 상태 조회
   * @returns 증분 렌더링 상태 객체
   */
  getIncrementalState: () => IncrementalRenderState;

  /**
   * 증분 렌더링 일시정지
   */
  pauseIncremental: () => void;

  /**
   * 증분 렌더링 재개
   */
  resumeIncremental: () => void;

  /**
   * 증분 렌더링 설정 변경
   * @param options 변경할 설정
   */
  setIncrementalOptions: (options: Partial<IncrementalRenderOptions>) => void;
}
