/**
 * 스트리밍 데이터 처리 인터페이스
 * 실시간 데이터 업데이트를 위한 타입 정의
 * @module types/streaming
 */

import type { DataPoint } from './index';

/**
 * 실시간 업데이트 옵션
 */
export interface RealtimeUpdateOptions {
  /** 업데이트 간격 (밀리초, 기본값: 1000) */
  updateInterval?: number;
  /** 최대 포인트 수 (오래된 데이터 자동 제거, 기본값: 무제한) */
  maxPoints?: number;
  /** 자동 스크롤 활성화 (기본값: true) */
  autoScroll?: boolean;
  /** 일시정지 상태 (기본값: false) */
  paused?: boolean;
}

/**
 * 실시간 데이터 스트림 핸들
 * 실시간 업데이트를 관리하기 위한 인터페이스
 */
export interface RealtimeStreamHandle {
  /** 스트림 시작 */
  start: () => void;
  /** 스트림 일시정지 */
  pause: () => void;
  /** 스트림 재개 */
  resume: () => void;
  /** 스트림 중지 */
  stop: () => void;
  /** 업데이트 간격 변경 */
  setUpdateInterval: (interval: number) => void;
  /** 최대 포인트 수 변경 */
  setMaxPoints: (maxPoints: number) => void;
  /** 현재 상태 확인 */
  getStatus: () => RealtimeStreamStatus;
}

/**
 * 실시간 스트림 상태
 */
export interface RealtimeStreamStatus {
  /** 실행 중 여부 */
  isRunning: boolean;
  /** 일시정지 여부 */
  isPaused: boolean;
  /** 총 업데이트 횟수 */
  updateCount: number;
  /** 현재 포인트 수 */
  currentPointCount: number;
  /** 업데이트 간격 (밀리초) */
  updateInterval: number;
}

/**
 * 데이터 생성기 함수 타입
 * 매 업데이트마다 호출되어 새로운 데이터 포인트를 생성합니다.
 */
export type DataGenerator = (timestamp: number) => DataPoint[];

/**
 * 업데이트 콜백 함수 타입
 * 데이터 업데이트 시 호출됩니다.
 */
export type UpdateCallback = (points: DataPoint[]) => void;

/**
 * 실시간 차트 설정
 */
export interface RealtimeChartConfig extends RealtimeUpdateOptions {
  /** 데이터 생성기 함수 */
  generator: DataGenerator;
  /** 업데이트 콜백 함수 (선택) */
  onUpdate?: UpdateCallback;
  /** 에러 콜백 함수 (선택) */
  onError?: (error: Error) => void;
}
