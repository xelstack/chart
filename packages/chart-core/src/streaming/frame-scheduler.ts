/**
 * 프레임 스케줄러
 * requestAnimationFrame 기반으로 데이터를 배치하여 다음 프레임에 일괄 렌더링
 * @module streaming/frame-scheduler
 */

import type { DataPoint } from '@chart/types/index';
import type { FrameScheduler, FrameSchedulerState, CreateFrameSchedulerOptions } from './types';

/**
 * FrameScheduler 인스턴스를 생성합니다.
 *
 * 프레임 스케줄러는 다음 기능을 제공합니다:
 * - 여러 데이터 업데이트를 다음 프레임까지 버퍼링
 * - requestAnimationFrame 기반의 효율적인 렌더링 타이밍
 * - 일시정지/재개 기능
 * - 프레임 시간 통계
 *
 * @param options 생성 옵션
 * @returns FrameScheduler 인스턴스
 */
export function createFrameScheduler(options: CreateFrameSchedulerOptions): FrameScheduler {
  const { onRender, onError } = options;

  // 상태
  let isActive = false;
  let isPaused = false;
  let scheduledFrameId: number | undefined = undefined;
  let frameCount = 0;
  let totalFrameTime = 0;
  let lastFrameTime: number | undefined = undefined;

  // 버퍼링된 데이터
  let pendingPoints: DataPoint[] = [];

  /**
   * 대기 데이터가 있을 때만 다음 프레임을 예약하고, 비어 있으면 루프를 정지(idle)시킵니다.
   * isActive는 그대로 유지되므로 scheduleRender/resume이 루프를 다시 깨울 수 있습니다.
   */
  function armNextFrameOrIdle(): void {
    if (pendingPoints.length > 0) {
      scheduledFrameId = requestAnimationFrame(frameCallback);
    } else {
      // 처리할 데이터가 없으면 RAF 루프를 멈춤 (불필요한 60fps wakeup 방지)
      scheduledFrameId = undefined;
    }
  }

  /**
   * 프레임 콜백 - 매 프레임마다 실행
   */
  function frameCallback(_timestamp: number): void {
    if (!isActive) {
      scheduledFrameId = undefined;
      return;
    }

    // 일시정지 상태면 루프를 멈추고 렌더링하지 않음 (resume이 다시 예약)
    if (isPaused) {
      scheduledFrameId = undefined;
      return;
    }

    // 렌더링할 데이터가 있는 경우에만 처리
    if (pendingPoints.length > 0) {
      const startTime = performance.now();

      try {
        // 버퍼의 모든 데이터를 한 번에 렌더링
        const pointsToRender = pendingPoints;
        pendingPoints = [];

        onRender(pointsToRender);

        // 통계 업데이트
        const elapsed = performance.now() - startTime;
        frameCount++;
        totalFrameTime += elapsed;
        lastFrameTime = elapsed;
      } catch (error) {
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    }

    // 다음 프레임 예약 (대기 데이터가 있을 때만, 없으면 idle)
    armNextFrameOrIdle();
  }

  return {
    /**
     * 스케줄러 시작
     * requestAnimationFrame 루프를 시작합니다.
     */
    start(): void {
      if (isActive) {
        return; // 이미 활성 상태
      }

      isActive = true;
      isPaused = false;
      scheduledFrameId = requestAnimationFrame(frameCallback);
    },

    /**
     * 스케줄러 정지
     * requestAnimationFrame 루프를 중지합니다.
     */
    stop(): void {
      isActive = false;
      isPaused = false;

      if (scheduledFrameId !== undefined) {
        cancelAnimationFrame(scheduledFrameId);
        scheduledFrameId = undefined;
      }

      // 대기 중인 데이터 클리어
      pendingPoints = [];
    },

    /**
     * 일시정지
     * RAF 루프를 멈추고 렌더링을 일시 중지합니다. (불필요한 wakeup 방지)
     * 대기 데이터(pendingPoints)는 보존되어 resume 시 렌더링됩니다.
     */
    pause(): void {
      isPaused = true;
      if (scheduledFrameId !== undefined) {
        cancelAnimationFrame(scheduledFrameId);
        scheduledFrameId = undefined;
      }
    },

    /**
     * 재개
     * 일시 중지된 렌더링을 재개합니다. 대기 데이터가 있으면 루프를 다시 시작합니다.
     */
    resume(): void {
      isPaused = false;
      if (isActive && scheduledFrameId === undefined && pendingPoints.length > 0) {
        scheduledFrameId = requestAnimationFrame(frameCallback);
      }
    },

    /**
     * 렌더링 예약
     * 데이터를 버퍼에 추가하여 다음 프레임에 일괄 렌더링합니다.
     * @param points 렌더링할 데이터 포인트
     */
    scheduleRender(points: readonly DataPoint[]): void {
      // 스케줄러가 활성 상태가 아니면 시작 (start가 첫 프레임을 예약)
      if (!isActive) {
        this.start();
      }

      // 버퍼에 추가
      pendingPoints = [...pendingPoints, ...points];

      // 루프가 idle 상태로 멈춰 있었다면 다시 깨움
      if (isActive && !isPaused && scheduledFrameId === undefined) {
        scheduledFrameId = requestAnimationFrame(frameCallback);
      }
    },

    /**
     * 현재 상태 조회
     */
    getStatus(): FrameSchedulerState {
      return {
        scheduledFrameId,
        isActive,
        isPaused,
        frameCount,
        lastFrameTime,
        averageFrameTime: frameCount > 0 ? totalFrameTime / frameCount : 0,
      };
    },
  };
}
