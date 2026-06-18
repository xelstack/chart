/**
 * 차트 렌더러
 * Canvas 렌더링 관련 로직
 * @module api/chart-renderer
 */

import type { Dataset, ChartConfig, Viewport } from '@chart/types/index';
import { renderToCanvas } from '@chart/effects/canvas-render';
import { updateCanvasSize } from '@chart/effects/dom-manipulation';

/**
 * 렌더러 액션 인터페이스
 */
export interface RendererActions {
  render: () => void;
  resize: (width: number, height: number) => void;
}

/**
 * 렌더러 컨텍스트
 */
export interface RendererContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  getDataset: () => Dataset;
  getViewport: () => Viewport;
  getConfig: () => ChartConfig;
  setConfig: (config: ChartConfig) => void;
}

/**
 * 차트 렌더러 생성
 * @param context 렌더러 컨텍스트
 * @returns RendererActions 인스턴스
 */
export function createRenderer(context: RendererContext): RendererActions {
  const { canvas, ctx, getDataset, getViewport, getConfig, setConfig } = context;

  return {
    render: () => {
      renderToCanvas(ctx, getDataset(), getConfig(), getViewport());
    },

    resize: (width: number, height: number) => {
      const config = getConfig();
      const newConfig = { ...config, width, height };
      setConfig(newConfig);
      updateCanvasSize(canvas, width, height);
    },
  };
}
