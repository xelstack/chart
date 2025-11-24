/**
 * 사이드 이펙트 함수 통합 export
 * @module effects
 */

// Canvas 렌더링
export { renderToCanvas } from './canvas-render';

// DOM 조작
export {
  createCanvas,
  updateCanvasSize,
  removeCanvas,
  destroyCanvas,
} from './dom-manipulation';

// 이벤트 핸들러
export { setupResizeObserver, cleanupResizeObserver } from './event-handlers';
