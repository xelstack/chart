/**
 * 함수형 차트 생성 API
 * @module api/create-chart
 */

import type { Dataset, ChartConfig, DataPoint, AddPointsOptions } from '../types/index';
import type { ChartHandle } from './chart-handle';
import { createCanvas, updateCanvasSize, destroyCanvas } from '../effects/dom-manipulation';
import { setupResizeObserver } from '../effects/event-handlers';
import { renderToCanvas } from '../effects/canvas-render';
import { mergeConfig } from '../utils/config-merge';
import {
  calculateViewportFromDataset,
  calculateZoomedViewport,
  calculatePannedViewport,
  calculateAutoScrollViewport,
} from '../utils/viewport-calculations';
import { validateDataset, validateChartConfig } from '../utils/validation';

/**
 * 차트를 생성하고 관리할 수 있는 핸들을 반환합니다.
 *
 * @param container - 차트가 렌더링될 DOM 요소
 * @param dataset - 차트 데이터셋
 * @param config - 차트 설정
 * @returns 차트를 관리할 수 있는 핸들 객체
 *
 * @example
 * ```typescript
 * const chart = createChart(
 *   document.getElementById('chart-container'),
 *   { points: [{ x: 0, y: 10 }, { x: 1, y: 20 }] },
 *   { type: 'line', width: 800, height: 600 }
 * );
 *
 * chart.updateData(newDataset);
 * chart.render();
 * chart.destroy();
 * ```
 *
 * @sideEffect DOM 조작, Canvas 생성
 */
export function createChart(
  container: HTMLElement,
  dataset: Dataset,
  config: Partial<ChartConfig>
): ChartHandle {
  // 개발 환경에서만 입력 검증 (프로덕션에서는 스킵하여 성능 향상)
  if (process.env.NODE_ENV !== 'production') {
    try {
      validateDataset(dataset);
      // config는 Partial이므로 기본값 병합 후 검증
      const tempConfig = { ...config, type: config.type ?? 'line' };
      validateChartConfig(tempConfig);
    } catch (error) {
      // 개발 환경에서는 명확한 에러 메시지 제공
      console.error('[Chart Validation Error]', error);
      throw error;
    }
  }

  // 기본 설정
  const defaultConfig: ChartConfig = {
    type: 'line',
    width: 800,
    height: 600,
    colors: ['#3366ff'],
    showGrid: true,
  };

  // 설정 병합 (순수 함수)
  let currentConfig = mergeConfig(defaultConfig, config);
  let currentDataset = dataset;
  let currentViewport = calculateViewportFromDataset(dataset.points);

  // Canvas 생성 (사이드 이펙트)
  const canvas = createCanvas(container, currentConfig.width ?? 800, currentConfig.height ?? 600);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D 컨텍스트를 가져올 수 없습니다');
  }

  // 컨텍스트를 non-null 타입으로 캐싱
  const safeCtx: CanvasRenderingContext2D = ctx;

  // ResizeObserver 설정 (사이드 이펙트)
  let cleanupResize: (() => void) | null = null;

  // responsive 속성이 명시적으로 false가 아니면 반응형 활성화
  const isResponsive = (currentConfig as { responsive?: boolean }).responsive !== false;

  if (isResponsive) {
    cleanupResize = setupResizeObserver(container, (width, height) => {
      updateCanvasSize(canvas, width, height);
      currentConfig = mergeConfig(currentConfig, { width, height });
      render();
    });
  }

  // 렌더링 함수
  function render() {
    renderToCanvas(safeCtx, currentDataset, currentConfig, currentViewport);
  }

  // 초기 렌더링 (차트 생성 시 자동으로 렌더링)
  render();

  // ChartHandle 반환
  return {
    /**
     * 데이터셋을 업데이트합니다.
     * @param dataset - 새로운 데이터셋
     */
    updateData: (dataset: Dataset) => {
      // realtime 모드에서 maxPoints 제한 적용
      const realtimeConfig = (currentConfig as { realtime?: { enabled?: boolean; maxPoints?: number } }).realtime;
      if (realtimeConfig?.enabled === true && typeof realtimeConfig.maxPoints === 'number') {
        const maxPoints = realtimeConfig.maxPoints;
        if (dataset.points.length > maxPoints) {
          // 최근 maxPoints개만 유지
          currentDataset = {
            ...dataset,
            points: dataset.points.slice(-maxPoints),
          };
        } else {
          currentDataset = dataset;
        }
      } else {
        currentDataset = dataset;
      }
      currentViewport = calculateViewportFromDataset(currentDataset.points);
    },

    /**
     * 설정을 업데이트합니다.
     * @param config - 업데이트할 설정 (부분)
     */
    updateConfig: (config: Partial<ChartConfig>) => {
      currentConfig = mergeConfig(currentConfig, config);

      // 크기 변경 시 Canvas 업데이트
      if (config.width !== undefined || config.height !== undefined) {
        updateCanvasSize(
          canvas,
          currentConfig.width ?? 800,
          currentConfig.height ?? 600
        );
      }
    },

    /**
     * 차트를 렌더링합니다.
     */
    render,

    /**
     * 차트 크기를 변경합니다.
     * @param width - 새로운 너비
     * @param height - 새로운 높이
     */
    resize: (width: number, height: number) => {
      currentConfig = mergeConfig(currentConfig, { width, height });
      updateCanvasSize(canvas, width, height);
      render();
    },

    /**
     * 뷰포트를 리셋합니다 (확대/이동 초기화).
     */
    resetViewport: () => {
      currentViewport = calculateViewportFromDataset(currentDataset.points);
      render();
    },

    /**
     * 뷰포트를 직접 설정합니다.
     * @param viewport - 새로운 뷰포트 객체
     */
    setViewport: (viewport) => {
      currentViewport = viewport;
      render();
    },

    /**
     * 차트를 확대/축소합니다.
     * @param factor - 확대/축소 배율 (1.0보다 크면 확대, 작으면 축소)
     * @param centerX - 중심 X 좌표 (선택, 기본값: 뷰포트 중심)
     * @param centerY - 중심 Y 좌표 (선택, 기본값: 뷰포트 중심)
     */
    zoom: (factor, centerX, centerY) => {
      currentViewport = calculateZoomedViewport(currentViewport, factor, centerX, centerY);
      render();
    },

    /**
     * 차트를 이동합니다.
     * @param deltaX - X축 이동 거리
     * @param deltaY - Y축 이동 거리
     */
    pan: (deltaX, deltaY) => {
      currentViewport = calculatePannedViewport(currentViewport, deltaX, deltaY);
      render();
    },

    /**
     * 현재 뷰포트를 반환합니다.
     * @returns 현재 뷰포트 객체
     */
    getViewport: () => currentViewport,

    /**
     * 현재 차트 상태를 반환합니다.
     * @returns 차트 상태 객체
     */
    getState: () => ({
      status: 'ready',
      pointCount: currentDataset.points.length,
      dataset: currentDataset,
      viewport: currentViewport,
      config: currentConfig,
    }),

    /**
     * 실시간으로 데이터 포인트를 추가합니다.
     * @param points - 추가할 데이터 포인트 배열
     * @param options - 추가 옵션 (autoRender, autoScroll)
     */
    addPoints: (points: DataPoint[], options?: AddPointsOptions) => {
      const { autoRender = false, autoScroll = false } = options ?? {};

      // 포인트 추가
      currentDataset = {
        ...currentDataset,
        points: [...currentDataset.points, ...points],
      };

      // realtime 모드에서 maxPoints 제한 적용
      const realtimeConfig = (currentConfig as { realtime?: { enabled?: boolean; maxPoints?: number } }).realtime;
      if (realtimeConfig?.enabled === true && typeof realtimeConfig.maxPoints === 'number') {
        const maxPoints = realtimeConfig.maxPoints;
        if (currentDataset.points.length > maxPoints) {
          // 최근 maxPoints개만 유지
          currentDataset = {
            ...currentDataset,
            points: currentDataset.points.slice(-maxPoints),
          };
        }
      }

      // 자동 스크롤
      if (autoScroll) {
        currentViewport = calculateAutoScrollViewport(currentViewport, points);
      }

      // 자동 렌더링
      if (autoRender) {
        render();
      }
    },

    /**
     * 리소스를 정리합니다.
     */
    destroy: () => {
      if (cleanupResize) {
        cleanupResize();
      }
      destroyCanvas(canvas);
    },
  };
}
