/**
 * 차트 라이브러리 공개 API (함수형)
 * @module index
 */

import type {
  Dataset,
  ChartConfig,
  ChartState,
  Viewport,
  DataPoint,
  ChartType,
  AxesConfig,
  AxisConfig,
  InteractionConfig,
  ChartStatus,
  WidgetConfig,
  WidgetInstance,
} from './types/index';

// 함수형 API export
export { createChart } from './api/create-chart';
export type { ChartHandle } from './api/chart-handle';

// 위젯 API export
export { createWidget } from './widget/widget';

// 타입 export
export type {
  Dataset,
  ChartConfig,
  ChartState,
  Viewport,
  DataPoint,
  ChartType,
  AxesConfig,
  AxisConfig,
  InteractionConfig,
  ChartStatus,
  WidgetConfig,
  WidgetInstance,
};

// 순수 함수 export (뷰포트 계산)
export {
  calculateViewportFromDataset,
  calculateZoomedViewport,
  calculatePannedViewport,
} from './utils/viewport-calculations';

// 순수 함수 export (설정 병합)
export { mergeConfig, deepMergeConfig } from './utils/config-merge';

// 순수 함수 export (데이터 변환)
export { filterPoints, sortPoints, mapPoints } from './utils/data-transforms';

// 함수형 프로그래밍 유틸리티 export
export { pipe } from './utils/fp/pipe';
export { compose } from './utils/fp/compose';
export { curry } from './utils/fp/curry';
export { deepFreeze, immutableUpdate } from './utils/fp/immutable';

// 샘플링 유틸리티 export
export { uniformSample, filterByViewport, adaptiveSample } from './utils/sampling';

// 사이드 이펙트 함수 export
export { renderToCanvas } from './effects/canvas-render';
export {
  createCanvas,
  updateCanvasSize,
  removeCanvas,
  destroyCanvas,
} from './effects/dom-manipulation';
export {
  setupResizeObserver,
  cleanupResizeObserver,
} from './effects/event-handlers';

// 차트 렌더링 함수 export
export { renderLineChart } from './charts/line';
export type { LineChartOptions } from './charts/line';
export { renderBarChart } from './charts/bar';
export type { BarChartOptions } from './charts/bar';
export { renderPieChart } from './charts/pie';
export type { PieChartOptions } from './charts/pie';
export { renderScatterChart } from './charts/scatter';
export type { ScatterChartOptions } from './charts/scatter';

// 에러 클래스 export
export { ValidationError, ChartTypeError } from './utils/errors';

