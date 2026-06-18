/**
 * 뷰포트 관리자
 * 뷰포트 상태 관리 (zoom, pan, reset)
 * @module api/viewport-manager
 */

import type { Viewport, DataPoint } from '@chart/types/index';
import {
  calculateViewportFromDataset,
  calculateZoomedViewport,
  calculatePannedViewport,
} from '@chart/utils/viewport-calculations';

/**
 * 뷰포트 관리자 액션 인터페이스
 */
export interface ViewportActions {
  getViewport: () => Viewport;
  setViewport: (viewport: Viewport) => void;
  resetViewport: () => void;
  zoom: (factor: number, centerX?: number, centerY?: number) => void;
  pan: (deltaX: number, deltaY: number) => void;
  recalculateFromData: (points: DataPoint[]) => void;
}

/**
 * 뷰포트 관리자 옵션
 */
export interface ViewportManagerOptions {
  initialPoints: DataPoint[];
  onViewportChange?: () => void;
}

/**
 * 뷰포트 관리자 생성
 * @param options 뷰포트 관리자 옵션
 * @returns ViewportActions 인스턴스
 */
export function createViewportManager(options: ViewportManagerOptions): ViewportActions {
  const { initialPoints, onViewportChange } = options;

  let currentViewport = calculateViewportFromDataset(initialPoints);

  const notifyChange = () => {
    onViewportChange?.();
  };

  return {
    getViewport: () => currentViewport,

    setViewport: (viewport: Viewport) => {
      currentViewport = viewport;
      notifyChange();
    },

    resetViewport: () => {
      // 마지막으로 알려진 데이터로 리셋 - 외부에서 recalculateFromData 호출 필요
      notifyChange();
    },

    zoom: (factor: number, centerX?: number, centerY?: number) => {
      currentViewport = calculateZoomedViewport(currentViewport, factor, centerX, centerY);
      notifyChange();
    },

    pan: (deltaX: number, deltaY: number) => {
      currentViewport = calculatePannedViewport(currentViewport, deltaX, deltaY);
      notifyChange();
    },

    recalculateFromData: (points: DataPoint[]) => {
      currentViewport = calculateViewportFromDataset(points);
    },
  };
}
