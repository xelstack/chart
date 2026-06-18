/**
 * 스트리밍 모듈
 * 실시간 차트의 증분 업데이트를 위한 모듈
 * @module streaming
 */

// 타입 export
export type {
  // DataBuffer
  CreateDataBufferOptions,
  DataBufferState,
  DataBuffer,
  // RenderQueue
  CreateRenderQueueOptions,
  RenderQueueState,
  RenderQueue,
  // DeltaResult
  DeltaResult,
  DeltaType,
  CalculateDeltaOptions,
  // FrameScheduler
  CreateFrameSchedulerOptions,
  FrameSchedulerState,
  FrameScheduler,
  // 통합 상태
  IncrementalRenderingState,
} from './types';

// 구현 export
export { createDataBuffer } from './data-buffer';
export { createColumnarRingBuffer } from './columnar-buffer';
export type {
  ColumnarDatasetView,
  ColumnarRingBuffer,
  CreateColumnarRingBufferOptions,
} from './columnar-buffer';
export { encodePoints } from './encode-points';
export type { EncodedPoints } from './encode-points';
export { createRenderQueue } from './render-queue';
export { calculateDelta, createDeltaCalculator } from './delta-calculator';
export type { DeltaCalculator, CreateDeltaCalculatorOptions } from './delta-calculator';
export { createFrameScheduler } from './frame-scheduler';
