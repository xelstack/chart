/**
 * 함수형 차트 생성 API
 * @module api/create-chart
 */

import type { Dataset, ChartConfig, DataPoint, AddPointsOptions } from '@chart/types/index';
import type { IncrementalAddPointsOptions } from '@chart/types/incremental';
import type { ChartHandle } from '@chart/api/chart-handle';
import { createCanvas, destroyCanvas } from '@chart/effects/dom-manipulation';
import { setupResizeObserver } from '@chart/effects/event-handlers';
import { mergeConfig } from '@chart/utils/config-merge';
import { calculateAutoScrollViewport } from '@chart/utils/viewport-calculations';
import { validateDataset, validateChartConfig } from '@chart/utils/validation';
import { createViewportManager, type ViewportActions } from './viewport-manager';
import { createDataManager, type DataActions } from './data-manager';
import { createRenderer, type RendererActions } from './chart-renderer';
import { createIncrementalRenderer, type IncrementalActions } from './incremental';

/**
 * 차트를 생성하고 관리할 수 있는 핸들을 반환합니다.
 */
export function createChart(
  container: HTMLElement,
  dataset: Dataset,
  config: Partial<ChartConfig>
): ChartHandle {
  // 개발 환경에서만 입력 검증
  if (process.env.NODE_ENV !== 'production') {
    try {
      validateDataset(dataset);
      const tempConfig = { ...config, type: config.type ?? 'line' };
      validateChartConfig(tempConfig);
    } catch (error) {
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

  let currentConfig = mergeConfig(defaultConfig, config);

  // Canvas 생성
  const canvas = createCanvas(container, currentConfig.width ?? 800, currentConfig.height ?? 600);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D 컨텍스트를 가져올 수 없습니다');
  const safeCtx: CanvasRenderingContext2D = ctx;

  // 뷰포트 관리자
  const viewportManager: ViewportActions = createViewportManager({
    initialPoints: dataset.points,
    onViewportChange: () => {
      incremental.invalidateOffscreen();
      renderer.render();
    },
  });

  // 데이터 관리자 (뷰포트 자동 업데이트 없이 데이터만 관리)
  const dataManager: DataActions = createDataManager({
    initialDataset: dataset,
    getConfig: () => currentConfig,
    // onDataChange는 updateData에서만 뷰포트 재계산, addPoints는 외부에서 처리
  });

  // 렌더러
  const renderer: RendererActions = createRenderer({
    canvas,
    ctx: safeCtx,
    getDataset: dataManager.getDataset,
    getViewport: viewportManager.getViewport,
    getConfig: () => currentConfig,
    setConfig: (cfg) => { currentConfig = cfg; },
  });

  // 증분 렌더러
  const incremental: IncrementalActions = createIncrementalRenderer({
    mainCtx: safeCtx,
    getConfig: () => currentConfig,
    getDataset: dataManager.getDataset,
    getViewport: viewportManager.getViewport,
    setDataset: (ds) => { dataManager.updateData(ds); },
    setViewport: (vp) => { viewportManager.setViewport(vp); },
    render: renderer.render,
  });

  // 파괴(destroy) 여부 플래그 - 파괴 후 메서드 호출을 무력화하여 stale 캔버스 접근/누수 방지
  let disposed = false;

  // ResizeObserver 설정
  let cleanupResize: (() => void) | null = null;
  const isResponsive = currentConfig.responsive !== false;
  if (isResponsive) {
    cleanupResize = setupResizeObserver(container, (width, height) => {
      if (disposed) return;
      renderer.resize(width, height);
      incremental.resize(width, height); // 오프스크린 캔버스도 같이 리사이즈
      renderer.render();
    });
  }

  // 초기 렌더링
  renderer.render();

  // ChartHandle 반환
  return {
    updateData: (newDataset: Dataset) => {
      if (disposed) return;
      dataManager.updateData(newDataset);
      // maxPoints 트림이 반영된 실제 데이터로 뷰포트·증분 버퍼를 동기화하고 다시 그린다
      const points = dataManager.getDataset().points;
      viewportManager.recalculateFromData(points);
      incremental.syncBuffer(points);
      renderer.render();
    },
    updateConfig: (cfg: Partial<ChartConfig>) => {
      if (disposed) return;
      currentConfig = mergeConfig(currentConfig, cfg);
      if (cfg.width !== undefined || cfg.height !== undefined) {
        const w = currentConfig.width ?? 800;
        const h = currentConfig.height ?? 600;
        renderer.resize(w, h);
        incremental.resize(w, h);
      }
      // 시각적 설정 변경(색상/타입/그리드 등)도 반영되도록 무효화 후 다시 그린다
      incremental.invalidateOffscreen();
      renderer.render();
    },
    render: () => {
      if (disposed) return;
      renderer.render();
    },
    resize: (width: number, height: number) => {
      if (disposed) return;
      renderer.resize(width, height);
      incremental.resize(width, height);
      renderer.render();
    },
    resetViewport: () => {
      if (disposed) return;
      viewportManager.recalculateFromData(dataManager.getDataset().points);
      incremental.invalidateOffscreen();
      renderer.render();
    },
    setViewport: (viewport) => {
      if (disposed) return;
      viewportManager.setViewport(viewport);
    },
    zoom: (factor: number, centerX?: number, centerY?: number) => {
      if (disposed) return;
      viewportManager.zoom(factor, centerX, centerY);
    },
    pan: (deltaX: number, deltaY: number) => {
      if (disposed) return;
      viewportManager.pan(deltaX, deltaY);
    },
    getViewport: viewportManager.getViewport,
    getState: () => ({
      status: 'ready',
      pointCount: dataManager.getDataset().points.length,
      dataset: dataManager.getDataset(),
      viewport: viewportManager.getViewport(),
      config: currentConfig,
    }),
    addPoints: (points: DataPoint[], options?: AddPointsOptions) => {
      if (disposed) return;
      const { autoRender = false, autoScroll = false } = options ?? {};
      dataManager.addPoints(points, options);
      if (autoScroll) {
        const newViewport = calculateAutoScrollViewport(viewportManager.getViewport(), points);
        viewportManager.setViewport(newViewport);
      }
      if (autoRender) renderer.render();
    },
    addPointsIncremental: (points: readonly DataPoint[], options?: IncrementalAddPointsOptions) => {
      if (disposed) return;
      incremental.addPointsIncremental(points, options);
      if (options?.autoScroll === true) {
        const newViewport = calculateAutoScrollViewport(viewportManager.getViewport(), [...points]);
        viewportManager.setViewport(newViewport);
      }
    },
    updateDataIncremental: incremental.updateDataIncremental,
    getIncrementalState: incremental.getIncrementalState,
    pauseIncremental: incremental.pauseIncremental,
    resumeIncremental: incremental.resumeIncremental,
    setIncrementalOptions: incremental.setIncrementalOptions,
    destroy: () => {
      if (disposed) return;
      disposed = true;
      cleanupResize?.();
      incremental.destroy();
      destroyCanvas(canvas);
    },
  };
}
