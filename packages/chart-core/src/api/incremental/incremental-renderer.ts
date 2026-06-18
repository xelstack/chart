/**
 * 증분 렌더러
 * 증분 렌더링 전체 로직
 * @module api/incremental/incremental-renderer
 */

import type { Dataset, ChartConfig, Viewport, DataPoint } from '@chart/types/index';
import type {
  IncrementalRenderOptions,
  IncrementalRenderState,
  IncrementalAddPointsOptions,
} from '@chart/types/incremental';
import { renderToCanvas } from '@chart/effects/canvas-render';
import { calculateViewportFromDataset } from '@chart/utils/viewport-calculations';
import { createDataBuffer } from '@chart/streaming/data-buffer';
import { createRenderQueue } from '@chart/streaming/render-queue';
import { calculateDelta } from '@chart/streaming/delta-calculator';
import { createFrameScheduler } from '@chart/streaming/frame-scheduler';
import type { FrameScheduler } from '@chart/streaming/types';
import { createOffscreenCanvas, type OffscreenCanvasManager } from './offscreen-canvas';

/**
 * 증분 렌더러 컨텍스트
 */
export interface IncrementalContext {
  mainCtx: CanvasRenderingContext2D;
  getConfig: () => ChartConfig;
  getDataset: () => Dataset;
  getViewport: () => Viewport;
  setDataset: (dataset: Dataset) => void;
  setViewport: (viewport: Viewport) => void;
  render: () => void;
}

/**
 * 증분 렌더러 액션 인터페이스
 */
export interface IncrementalActions {
  addPointsIncremental: (points: readonly DataPoint[], options?: IncrementalAddPointsOptions) => void;
  updateDataIncremental: (nextData: readonly DataPoint[]) => void;
  getIncrementalState: () => IncrementalRenderState;
  pauseIncremental: () => void;
  resumeIncremental: () => void;
  setIncrementalOptions: (options: Partial<IncrementalRenderOptions>) => void;
  invalidateOffscreen: () => void;
  /** 오프스크린 캔버스를 메인 캔버스와 같은 크기로 리사이즈 */
  resize: (width: number, height: number) => void;
  /** 전체 데이터셋으로 내부 버퍼를 동기화 (updateData 등 비증분 경로와 일관성 유지) */
  syncBuffer: (points: readonly DataPoint[]) => void;
  destroy: () => void;
}

/**
 * 증분 렌더러 생성
 * @param context 증분 렌더러 컨텍스트
 * @returns IncrementalActions 인스턴스
 */
export function createIncrementalRenderer(context: IncrementalContext): IncrementalActions {
  const { mainCtx, getConfig, getDataset, setDataset, setViewport, render } = context;

  let incrementalOptions: IncrementalRenderOptions = {
    enabled: true,
    frameBuffering: true,
    maxPoints: undefined,
  };

  let incrementalPaused = false;
  let isDisposed = false;
  let frameCount = 0;
  let totalFrameTime = 0;

  const dataBuffer = createDataBuffer({
    initialData: getDataset().points,
    maxPoints: incrementalOptions.maxPoints,
  });

  const renderQueue = createRenderQueue();
  const offscreen: OffscreenCanvasManager = createOffscreenCanvas();
  let frameScheduler: FrameScheduler | null = null;

  // 오프스크린 캔버스 초기화
  const config = getConfig();
  offscreen.init(config.width ?? 800, config.height ?? 600);

  const onFrameRender = (points: readonly DataPoint[]): void => {
    if (isDisposed || points.length === 0 || !offscreen.ctx || !offscreen.canvas) return;

    const startTime = performance.now();
    dataBuffer.flush();

    const newDataset: Dataset = {
      ...getDataset(),
      points: [...dataBuffer.getCurrent()],
    };
    setDataset(newDataset);

    const newViewport = calculateViewportFromDataset(newDataset.points);
    setViewport(newViewport);

    renderToCanvas(offscreen.ctx, newDataset, getConfig(), newViewport);

    const cfg = getConfig();
    mainCtx.clearRect(0, 0, cfg.width ?? 800, cfg.height ?? 600);
    mainCtx.drawImage(offscreen.canvas, 0, 0);

    frameCount++;
    totalFrameTime += performance.now() - startTime;
    offscreen.validate();
  };

  const initFrameScheduler = (): void => {
    // destroy 이후에는 스케줄러를 절대 재생성하지 않음 (RAF 루프 부활 방지)
    if (isDisposed || frameScheduler) return;
    frameScheduler = createFrameScheduler({
      onRender: onFrameRender,
      onError: (error) => console.error('[FrameScheduler Error]', error),
    });
  };

  return {
    addPointsIncremental: (points: readonly DataPoint[], options?: IncrementalAddPointsOptions) => {
      if (isDisposed || points.length === 0) return;

      const { autoRender = true } = options ?? {};

      // 렌더하지 않거나 일시정지 상태면 renderQueue에만 보관 (resume 시 재생).
      // dataBuffer에는 넣지 않아 in-flight 포인트가 한 곳에만 존재하도록 한다.
      if (!autoRender || incrementalPaused) {
        renderQueue.enqueue(points);
        return;
      }

      // 즉시 렌더 경로: dataBuffer(pending)를 단일 in-flight 저장소로 사용
      dataBuffer.addPoints(points);

      if (incrementalOptions.frameBuffering === true) {
        initFrameScheduler();
        // 스케줄러는 프레임 tick 역할. onFrameRender가 dataBuffer를 flush하여 렌더한다.
        frameScheduler?.scheduleRender(points);
      } else {
        onFrameRender(points);
      }
    },

    updateDataIncremental: (nextData: readonly DataPoint[]) => {
      if (isDisposed) return;

      // 진행 중인 버퍼링 작업을 먼저 정리(reconcile)한다:
      // 1) pending을 current로 flush하여 델타를 "실제 논리 상태" 기준으로 계산 (중복 카운트 방지)
      // 2) 예약된 프레임을 취소해 stale 프레임이 변경된 상태에 덮어쓰지 못하게 함
      dataBuffer.flush();
      frameScheduler?.stop();
      renderQueue.clear();

      const currentPoints = dataBuffer.getCurrent();
      const delta = calculateDelta(currentPoints, nextData);

      switch (delta.type) {
        case 'none':
          return;
        case 'append': {
          // 데이터는 항상 버퍼/상태에 반영하여 절대 유실되지 않게 한다.
          // (일시정지/오프스크린 미가용 시에도 커밋되며, 실제 그리기만 게이팅)
          dataBuffer.addPoints(delta.newPoints);
          dataBuffer.flush();

          const newDataset: Dataset = { ...getDataset(), points: [...dataBuffer.getCurrent()] };
          setDataset(newDataset);
          const newViewport = calculateViewportFromDataset(newDataset.points);
          setViewport(newViewport);

          if (!incrementalPaused && offscreen.ctx && offscreen.canvas) {
            renderToCanvas(offscreen.ctx, newDataset, getConfig(), newViewport);
            const cfg = getConfig();
            mainCtx.clearRect(0, 0, cfg.width ?? 800, cfg.height ?? 600);
            mainCtx.drawImage(offscreen.canvas, 0, 0);
            frameCount++;
            offscreen.validate();
          } else {
            // 일시정지/오프스크린 미가용: 데이터는 커밋됨. resume 시 다시 그리도록 무효화.
            offscreen.invalidate();
          }
          break;
        }
        case 'prepend':
        case 'replace': {
          const points = delta.type === 'prepend' ? nextData : delta.points;
          setDataset({ ...getDataset(), points: [...points] });
          setViewport(calculateViewportFromDataset([...points]));
          offscreen.invalidate();
          dataBuffer.clear();
          dataBuffer.addPoints(points);
          dataBuffer.flush();
          render();
          break;
        }
      }
    },

    getIncrementalState: (): IncrementalRenderState => {
      const bufferState = dataBuffer.getState();
      const queueState = renderQueue.getState();

      return {
        totalPoints: bufferState.totalCount,
        // in-flight = 아직 커밋되지 않은 dataBuffer.pending + 일시정지 보관 큐
        pendingPoints: bufferState.pending.length + queueState.size,
        frameCount,
        averageFrameTime: frameCount > 0 ? totalFrameTime / frameCount : 0,
        isPaused: incrementalPaused,
        // 실제 상태에서 파생 (destroy 후/비활성 시 false)
        isActive: !isDisposed && incrementalOptions.enabled !== false,
        isOffscreenValid: offscreen.isValid,
      };
    },

    pauseIncremental: () => {
      if (isDisposed) return;
      incrementalPaused = true;
      frameScheduler?.pause();
    },

    resumeIncremental: () => {
      if (isDisposed) return;
      incrementalPaused = false;
      // 일시정지 전에 예약돼 있던(스케줄러 보관) 포인트를 다시 그림
      frameScheduler?.resume();

      // 일시정지 중 들어온(renderQueue 보관) 포인트를 재생
      if (!renderQueue.isEmpty() && offscreen.ctx && offscreen.canvas) {
        const queued = renderQueue.dequeueAll();
        if (queued.length > 0) {
          dataBuffer.addPoints(queued);
          if (incrementalOptions.frameBuffering === true) {
            initFrameScheduler();
            frameScheduler?.scheduleRender(queued);
          } else {
            onFrameRender(queued);
          }
        }
      } else if (!offscreen.isValid) {
        // 일시정지 중 updateDataIncremental(append) 등으로 상태가 바뀌었으면 다시 그림
        render();
      }
    },

    setIncrementalOptions: (options: Partial<IncrementalRenderOptions>) => {
      if (isDisposed) return;
      incrementalOptions = { ...incrementalOptions, ...options };
      if (options.maxPoints !== undefined) {
        dataBuffer.setMaxPoints(options.maxPoints);
      }
    },

    invalidateOffscreen: () => {
      if (isDisposed) return;
      offscreen.invalidate();
    },

    resize: (width: number, height: number) => {
      if (isDisposed) return;
      // 오프스크린 캔버스를 메인 캔버스와 같은 크기로 재설정 (resize 시 stale 크기 blit 방지)
      offscreen.resize(width, height);
    },

    syncBuffer: (points: readonly DataPoint[]) => {
      if (isDisposed) return;
      // 비증분 updateData 등으로 데이터셋이 통째로 바뀐 경우 내부 버퍼를 동기화하여
      // 이후 델타 계산이 stale 상태 기준으로 잘못 분류되지 않도록 한다.
      frameScheduler?.stop();
      renderQueue.clear();
      dataBuffer.clear();
      dataBuffer.addPoints(points);
      dataBuffer.flush();
      offscreen.invalidate();
    },

    destroy: () => {
      isDisposed = true;
      frameScheduler?.stop();
      frameScheduler = null;
      offscreen.destroy();
      renderQueue.clear();
      dataBuffer.clear();
    },
  };
}
