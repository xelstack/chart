/**
 * 증분 렌더링 모듈 barrel export
 * @module api/incremental
 */

export { createOffscreenCanvas, type OffscreenCanvasManager } from './offscreen-canvas';
export {
  createIncrementalRenderer,
  type IncrementalContext,
  type IncrementalActions,
} from './incremental-renderer';
