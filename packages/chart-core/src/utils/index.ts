/**
 * 유틸리티 함수 통합 export
 * @module utils
 */

// 순수 함수 - 뷰포트 계산
export {
  calculateViewportFromDataset,
  calculateZoomedViewport,
  calculatePannedViewport,
} from './viewport-calculations';

// 순수 함수 - 설정 병합
export { mergeConfig, deepMergeConfig } from './config-merge';

// 순수 함수 - 데이터 변환
export { filterPoints, sortPoints, mapPoints } from './data-transforms';

// 샘플링 유틸리티
export { uniformSample, filterByViewport, adaptiveSample } from './sampling';

// 디바이스 감지 유틸리티
export {
  getDeviceInfo,
  isMobileDevice,
  isLowPerformanceDevice,
  type DeviceInfo,
  type DeviceType,
  type DevicePerformance,
} from './device-detection';

// 가상화 유틸리티
export {
  virtualizeDataset,
  chunkDataset,
  calculateVirtualRange,
  type VirtualizedDataset,
} from './virtualization';

// 검증 유틸리티
export {
  validateDataPoint,
  validateDataset,
  validateAxisConfig,
  validateChartConfig,
} from './validation';

// 에러 클래스
export { ValidationError, ChartTypeError } from './errors';

// 함수형 프로그래밍 유틸리티
export * from './fp';
