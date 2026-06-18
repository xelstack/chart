/**
 * 스트리밍 모듈 타입 정의
 * DataBuffer, RenderQueue, DeltaResult, FrameScheduler 인터페이스
 * @module streaming/types
 */

import type { DataPoint } from '@chart/types/index';

/**
 * DataBuffer 생성 옵션
 */
export interface CreateDataBufferOptions {
  /** 초기 데이터 (선택) */
  initialData?: readonly DataPoint[];
  /** 최대 포인트 수 (선택, 기본값: 무제한) */
  maxPoints?: number;
}

/**
 * DataBuffer 상태 (읽기 전용)
 */
export interface DataBufferState {
  /** 현재 렌더링된 데이터 */
  readonly current: readonly DataPoint[];
  /** 다음 프레임에 렌더링될 대기 데이터 */
  readonly pending: readonly DataPoint[];
  /** 마지막으로 렌더링된 데이터의 인덱스 */
  readonly lastRenderedIndex: number;
  /** 최대 보관 포인트 수 (undefined = 무제한) */
  readonly maxPoints: number | undefined;
  /** 현재 총 데이터 포인트 수 */
  readonly totalCount: number;
}

/**
 * DataBuffer 인스턴스 인터페이스
 */
export interface DataBuffer {
  /** 현재 렌더링된 데이터 조회 */
  getCurrent(): readonly DataPoint[];
  /** 대기 중인 데이터 조회 */
  getPending(): readonly DataPoint[];
  /** 데이터 추가 */
  addPoints(points: readonly DataPoint[]): void;
  /** 대기 데이터를 현재 데이터로 플러시하고 플러시된 데이터 반환 */
  flush(): readonly DataPoint[];
  /** 버퍼 초기화 */
  clear(): void;
  /** 총 데이터 수 조회 */
  getTotalCount(): number;
  /** maxPoints 설정 변경 */
  setMaxPoints(maxPoints: number | undefined): void;
  /** 현재 상태 스냅샷 조회 */
  getState(): DataBufferState;
}

/**
 * RenderQueue 생성 옵션
 */
export interface CreateRenderQueueOptions {
  /** 큐 최대 크기 (선택, 기본값: 무제한) */
  maxSize?: number;
}

/**
 * RenderQueue 상태 (읽기 전용)
 */
export interface RenderQueueState {
  /** 렌더링 대기 중인 데이터 포인트들 */
  readonly items: readonly DataPoint[];
  /** 큐가 비어있는지 여부 */
  readonly isEmpty: boolean;
  /** 현재 큐에 있는 아이템 수 */
  readonly size: number;
  /** 마지막 enqueue 타임스탬프 */
  readonly lastEnqueueTime: number | undefined;
  /** maxSize 초과로 폐기된 누적 포인트 수 (백프레셔 감지용) */
  readonly droppedCount: number;
}

/**
 * RenderQueue 인스턴스 인터페이스
 */
export interface RenderQueue {
  /** 데이터 추가 */
  enqueue(points: readonly DataPoint[]): void;
  /** 모든 데이터 추출 (큐 비움) */
  dequeueAll(): readonly DataPoint[];
  /** 큐가 비어있는지 확인 */
  isEmpty(): boolean;
  /** 큐 크기 조회 */
  getSize(): number;
  /** 큐 초기화 */
  clear(): void;
  /** 현재 상태 스냅샷 조회 */
  getState(): RenderQueueState;
}

/**
 * 델타 계산 결과 - 두 데이터 상태 간의 차이
 */
export type DeltaResult =
  | { readonly type: 'append'; readonly newPoints: readonly DataPoint[] }
  | { readonly type: 'prepend'; readonly newPoints: readonly DataPoint[] }
  | { readonly type: 'replace'; readonly points: readonly DataPoint[] }
  | { readonly type: 'none' };

/**
 * 델타 타입 열거
 */
export type DeltaType = 'append' | 'prepend' | 'replace' | 'none';

/**
 * 델타 계산 옵션
 */
export interface CalculateDeltaOptions {
  /** prepend 체크 스킵 여부 (성능 최적화, 실시간 append만 사용 시 true) */
  skipPrependCheck?: boolean;
}

/**
 * FrameScheduler 생성 옵션
 */
export interface CreateFrameSchedulerOptions {
  /** 렌더링 콜백 */
  onRender: (points: readonly DataPoint[]) => void;
  /** 에러 콜백 (선택) */
  onError?: (error: Error) => void;
}

/**
 * FrameScheduler 상태 (읽기 전용)
 */
export interface FrameSchedulerState {
  /** 현재 예약된 프레임 ID (없으면 undefined) */
  readonly scheduledFrameId: number | undefined;
  /** 스케줄러 활성화 상태 */
  readonly isActive: boolean;
  /** 일시정지 상태 */
  readonly isPaused: boolean;
  /** 처리된 총 프레임 수 */
  readonly frameCount: number;
  /** 마지막 프레임 처리 시간 (ms) */
  readonly lastFrameTime: number | undefined;
  /** 평균 프레임 처리 시간 (ms) */
  readonly averageFrameTime: number;
}

/**
 * FrameScheduler 인스턴스 인터페이스
 */
export interface FrameScheduler {
  /** 스케줄러 시작 */
  start(): void;
  /** 스케줄러 정지 */
  stop(): void;
  /** 일시정지 */
  pause(): void;
  /** 재개 */
  resume(): void;
  /** 렌더링 예약 (다음 프레임에 실행) */
  scheduleRender(points: readonly DataPoint[]): void;
  /** 현재 상태 조회 */
  getStatus(): FrameSchedulerState;
}

/**
 * 증분 렌더링의 전체 상태
 */
export interface IncrementalRenderingState {
  /** 데이터 버퍼 상태 */
  readonly buffer: DataBufferState;
  /** 렌더링 큐 상태 */
  readonly queue: RenderQueueState;
  /** 프레임 스케줄러 상태 */
  readonly scheduler: FrameSchedulerState;
  /** 오프스크린 캔버스 유효 여부 */
  readonly isOffscreenValid: boolean;
  /** 뷰포트 변경으로 인한 재렌더 필요 여부 */
  readonly needsFullRedraw: boolean;
}
