/**
 * 증분 렌더링 타입 정의
 * 실시간 차트의 증분 업데이트를 위한 타입들
 * @module types/incremental
 */

import type { DataPoint } from './index';

/**
 * 증분 렌더링 옵션
 */
export interface IncrementalRenderOptions {
  /** 증분 렌더링 활성화 (기본값: true) */
  enabled?: boolean;
  /** 프레임 버퍼링 활성화 (기본값: true) */
  frameBuffering?: boolean;
  /** 최대 포인트 수 (선택) */
  maxPoints?: number;
}

/**
 * 포인트 추가 옵션 (증분 렌더링용 확장)
 */
export interface IncrementalAddPointsOptions {
  /** 포인트 추가 후 자동으로 렌더링할지 여부 (기본값: true) */
  autoRender?: boolean;
  /** 포인트 추가 후 뷰포트를 자동으로 스크롤할지 여부 (기본값: false) */
  autoScroll?: boolean;
}

/**
 * 증분 렌더링 상태
 */
export interface IncrementalRenderState {
  /** 총 데이터 포인트 수 */
  readonly totalPoints: number;
  /** 렌더링 대기 중인 포인트 수 */
  readonly pendingPoints: number;
  /** 처리된 프레임 수 */
  readonly frameCount: number;
  /** 평균 프레임 처리 시간 (ms) */
  readonly averageFrameTime: number;
  /** 일시정지 상태 */
  readonly isPaused: boolean;
  /** 활성화 상태 */
  readonly isActive: boolean;
  /** 오프스크린 캔버스 유효 여부 */
  readonly isOffscreenValid: boolean;
}

/**
 * 증분 업데이트용 ChartHandle 확장 인터페이스
 */
export interface IncrementalChartHandle {
  /**
   * 데이터 포인트 추가 (증분 렌더링)
   * @param points 추가할 데이터 포인트
   * @param options 추가 옵션
   */
  addPointsIncremental(points: readonly DataPoint[], options?: IncrementalAddPointsOptions): void;

  /**
   * 배치 업데이트 (델타 계산 후 증분 렌더링)
   * @param nextData 다음 상태의 전체 데이터
   */
  updateDataIncremental(nextData: readonly DataPoint[]): void;

  /**
   * 증분 렌더링 상태 조회
   */
  getIncrementalState(): IncrementalRenderState;

  /**
   * 증분 렌더링 일시정지
   */
  pauseIncremental(): void;

  /**
   * 증분 렌더링 재개
   */
  resumeIncremental(): void;

  /**
   * 증분 렌더링 설정 변경
   */
  setIncrementalOptions(options: Partial<IncrementalRenderOptions>): void;
}
