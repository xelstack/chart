/**
 * 데이터 관리자
 * 데이터셋 관리 (updateData, addPoints)
 * @module api/data-manager
 */

import type { Dataset, ChartConfig, DataPoint, AddPointsOptions } from '@chart/types/index';

/**
 * 데이터 관리자 액션 인터페이스
 */
export interface DataActions {
  getDataset: () => Dataset;
  updateData: (dataset: Dataset) => void;
  addPoints: (points: DataPoint[], options?: AddPointsOptions) => void;
}

/**
 * 데이터 관리자 옵션
 */
export interface DataManagerOptions {
  initialDataset: Dataset;
  getConfig: () => ChartConfig;
  onDataChange?: (dataset: Dataset) => void;
}

/**
 * realtime 설정 타입
 */
interface RealtimeConfig {
  enabled?: boolean;
  maxPoints?: number;
}

/**
 * 데이터 관리자 생성
 * @param options 데이터 관리자 옵션
 * @returns DataActions 인스턴스
 */
export function createDataManager(options: DataManagerOptions): DataActions {
  const { initialDataset, getConfig, onDataChange } = options;

  let currentDataset = initialDataset;

  const applyMaxPointsLimit = (dataset: Dataset): Dataset => {
    const config = getConfig();
    const realtimeConfig = (config as { realtime?: RealtimeConfig }).realtime;

    if (realtimeConfig?.enabled === true && typeof realtimeConfig.maxPoints === 'number') {
      const maxPoints = realtimeConfig.maxPoints;
      // maxPoints <= 0 보호: slice(-0)이 전체 배열을 복사해 cap이 적용되지 않던 문제 방지
      if (maxPoints <= 0) {
        return dataset.points.length === 0 ? dataset : { ...dataset, points: [] };
      }
      if (dataset.points.length > maxPoints) {
        return {
          ...dataset,
          points: dataset.points.slice(-maxPoints),
        };
      }
    }
    return dataset;
  };

  return {
    getDataset: () => currentDataset,

    updateData: (dataset: Dataset) => {
      currentDataset = applyMaxPointsLimit(dataset);
      onDataChange?.(currentDataset);
    },

    addPoints: (points: DataPoint[], _options?: AddPointsOptions) => {
      currentDataset = {
        ...currentDataset,
        points: [...currentDataset.points, ...points],
      };

      currentDataset = applyMaxPointsLimit(currentDataset);
      onDataChange?.(currentDataset);
    },
  };
}
