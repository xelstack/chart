/**
 * FrameScheduler 단위 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFrameScheduler } from '../../../src/streaming/frame-scheduler';
import type { DataPoint } from '../../../src/types/index';

describe('FrameScheduler', () => {
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>;
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>;
  let rafCallback: ((timestamp: number) => void) | null = null;
  let frameId = 0;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock requestAnimationFrame
    mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      rafCallback = callback;
      return ++frameId;
    });

    mockCancelAnimationFrame = vi.fn();

    vi.stubGlobal('requestAnimationFrame', mockRequestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    rafCallback = null;
    frameId = 0;
  });

  describe('createFrameScheduler', () => {
    it('should create scheduler with render callback', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      expect(scheduler).toBeDefined();
      expect(scheduler.getStatus).toBeDefined();
    });

    it('should start inactive', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      const status = scheduler.getStatus();
      expect(status.isActive).toBe(false);
      expect(status.isPaused).toBe(false);
    });
  });

  describe('start', () => {
    it('should activate scheduler and request animation frame', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();

      expect(mockRequestAnimationFrame).toHaveBeenCalled();
      expect(scheduler.getStatus().isActive).toBe(true);
    });

    it('should not double-start if already active', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();
      scheduler.start();

      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop', () => {
    it('should deactivate scheduler and cancel animation frame', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();
      scheduler.stop();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
      expect(scheduler.getStatus().isActive).toBe(false);
    });

    it('should clear pending points', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();
      scheduler.scheduleRender([{ x: 0, y: 10 }]);
      scheduler.stop();

      // After stop, pending points should be cleared
      // Start again and trigger frame - should not render anything
      scheduler.start();
      if (rafCallback) {
        rafCallback(performance.now());
      }

      expect(onRender).not.toHaveBeenCalled();
    });
  });

  describe('pause and resume', () => {
    it('should set paused state', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();
      scheduler.pause();

      expect(scheduler.getStatus().isPaused).toBe(true);
    });

    it('should resume from paused state', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();
      scheduler.pause();
      scheduler.resume();

      expect(scheduler.getStatus().isPaused).toBe(false);
    });

    it('should not render while paused', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();
      scheduler.scheduleRender([{ x: 0, y: 10 }]);
      scheduler.pause();

      // Simulate frame callback while paused
      if (rafCallback) {
        rafCallback(performance.now());
      }

      expect(onRender).not.toHaveBeenCalled();
    });
  });

  describe('scheduleRender', () => {
    it('should buffer points for next frame', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.scheduleRender([{ x: 0, y: 10 }]);

      // Should auto-start
      expect(scheduler.getStatus().isActive).toBe(true);
    });

    it('should accumulate multiple scheduleRender calls', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.scheduleRender([{ x: 0, y: 10 }]);
      scheduler.scheduleRender([{ x: 1, y: 20 }]);

      // Trigger frame
      if (rafCallback) {
        rafCallback(performance.now());
      }

      expect(onRender).toHaveBeenCalledTimes(1);
      expect(onRender).toHaveBeenCalledWith([
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ]);
    });

    it('should render all buffered points in one frame', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 30 },
      ];

      scheduler.scheduleRender(points);

      // Trigger frame
      if (rafCallback) {
        rafCallback(performance.now());
      }

      expect(onRender).toHaveBeenCalledWith(points);
    });
  });

  describe('getStatus', () => {
    it('should return complete status', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();

      const status = scheduler.getStatus();

      expect(status).toEqual({
        scheduledFrameId: expect.any(Number),
        isActive: true,
        isPaused: false,
        frameCount: 0,
        lastFrameTime: undefined,
        averageFrameTime: 0,
      });
    });

    it('should update frame statistics after render', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();
      scheduler.scheduleRender([{ x: 0, y: 10 }]);

      // Trigger frame
      if (rafCallback) {
        rafCallback(performance.now());
      }

      const status = scheduler.getStatus();

      expect(status.frameCount).toBe(1);
      expect(status.lastFrameTime).toBeDefined();
      expect(status.averageFrameTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should call onError callback when render throws', () => {
      const onRender = vi.fn(() => {
        throw new Error('Render error');
      });
      const onError = vi.fn();
      const scheduler = createFrameScheduler({ onRender, onError });

      scheduler.scheduleRender([{ x: 0, y: 10 }]);

      // Trigger frame
      if (rafCallback) {
        rafCallback(performance.now());
      }

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should continue running after error', () => {
      let renderCount = 0;
      const onRender = vi.fn(() => {
        renderCount++;
        if (renderCount === 1) {
          throw new Error('First render error');
        }
      });
      const onError = vi.fn();
      const scheduler = createFrameScheduler({ onRender, onError });

      scheduler.scheduleRender([{ x: 0, y: 10 }]);

      // Trigger first frame (error)
      if (rafCallback) {
        rafCallback(performance.now());
      }

      // Scheduler should still be active
      expect(scheduler.getStatus().isActive).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should not render when no points are scheduled', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();

      // Trigger frame without scheduling any points
      if (rafCallback) {
        rafCallback(performance.now());
      }

      expect(onRender).not.toHaveBeenCalled();
    });

    it('should handle empty array in scheduleRender', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.scheduleRender([]);

      // Trigger frame
      if (rafCallback) {
        rafCallback(performance.now());
      }

      expect(onRender).not.toHaveBeenCalled();
    });
  });

  // 회귀: RAF 루프가 idle 상태에서 영원히 도는 문제 + pause가 루프를 멈추지 않던 문제
  describe('idle loop and lifecycle (regression)', () => {
    it('should go idle (stop re-arming RAF) once the buffer drains', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.scheduleRender([{ x: 0, y: 10 }]); // auto-start + 첫 프레임 예약 (RAF 1회)
      const callsAfterSchedule = mockRequestAnimationFrame.mock.calls.length;

      // 프레임 실행 -> 렌더 후 대기 데이터가 비므로 다시 예약하지 않아야 함
      rafCallback?.(performance.now());

      expect(onRender).toHaveBeenCalledTimes(1);
      expect(mockRequestAnimationFrame.mock.calls.length).toBe(callsAfterSchedule);
      expect(scheduler.getStatus().scheduledFrameId).toBeUndefined();
      // 활성 상태는 유지 (idle일 뿐 정지된 것은 아님)
      expect(scheduler.getStatus().isActive).toBe(true);
    });

    it('should NOT keep re-arming RAF on idle frames', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start(); // RAF 1회
      const before = mockRequestAnimationFrame.mock.calls.length;

      // 대기 데이터 없이 프레임 실행 -> idle, 재예약 없음
      rafCallback?.(performance.now());

      expect(onRender).not.toHaveBeenCalled();
      expect(mockRequestAnimationFrame.mock.calls.length).toBe(before);
      expect(scheduler.getStatus().scheduledFrameId).toBeUndefined();
    });

    it('should re-arm RAF when new points are scheduled after going idle', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.scheduleRender([{ x: 0, y: 10 }]);
      rafCallback?.(performance.now()); // idle 진입
      const before = mockRequestAnimationFrame.mock.calls.length;

      scheduler.scheduleRender([{ x: 1, y: 20 }]); // idle -> 다시 깨움

      expect(mockRequestAnimationFrame.mock.calls.length).toBe(before + 1);
      expect(scheduler.getStatus().scheduledFrameId).toBeDefined();
    });

    it('pause should cancel the scheduled frame', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();
      scheduler.pause();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
      expect(scheduler.getStatus().scheduledFrameId).toBeUndefined();
      expect(scheduler.getStatus().isPaused).toBe(true);
    });

    it('resume should re-arm RAF when pending points exist', () => {
      const onRender = vi.fn();
      const scheduler = createFrameScheduler({ onRender });

      scheduler.start();
      scheduler.scheduleRender([{ x: 0, y: 10 }]);
      scheduler.pause(); // 프레임 취소, 대기 데이터 보존
      const before = mockRequestAnimationFrame.mock.calls.length;

      scheduler.resume();

      expect(mockRequestAnimationFrame.mock.calls.length).toBe(before + 1);
      // resume 후 프레임이 실행되면 보존된 데이터가 렌더링됨
      rafCallback?.(performance.now());
      expect(onRender).toHaveBeenCalledWith([{ x: 0, y: 10 }]);
    });
  });
});
