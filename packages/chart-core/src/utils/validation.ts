/**
 * 데이터 검증 유틸리티
 * @module utils/validation
 */

import type { DataPoint, Dataset, ChartConfig, AxisConfig } from '@chart/types/index';
import { ValidationError } from './errors';

/**
 * DataPoint 검증
 * @param point - 검증할 데이터 포인트
 * @throws {ValidationError} 검증 실패 시
 */
export function validateDataPoint(point: unknown): asserts point is DataPoint {
  if (point === null || point === undefined || typeof point !== 'object') {
    throw new ValidationError('DataPoint는 객체여야 합니다', 'point');
  }

  const p = point as Record<string, unknown>;

  // x 필드 검증
  if (p.x === null || p.x === undefined) {
    throw new ValidationError('DataPoint.x는 필수입니다', 'x');
  }

  const xType = typeof p.x;
  if (xType !== 'number' && xType !== 'string' && !(p.x instanceof Date)) {
    throw new ValidationError('DataPoint.x는 number, string, 또는 Date여야 합니다', 'x');
  }

  // y 필드 검증
  if (p.y === null || p.y === undefined) {
    throw new ValidationError('DataPoint.y는 필수입니다', 'y');
  }

  if (typeof p.y !== 'number') {
    throw new ValidationError('DataPoint.y는 number여야 합니다', 'y');
  }

  if (!Number.isFinite(p.y)) {
    throw new ValidationError('DataPoint.y는 유한한 숫자여야 합니다 (NaN, Infinity 불가)', 'y');
  }
}

/**
 * Dataset 검증
 * @param dataset - 검증할 데이터셋
 * @throws {ValidationError} 검증 실패 시
 */
export function validateDataset(dataset: unknown): asserts dataset is Dataset {
  if (dataset === null || dataset === undefined || typeof dataset !== 'object') {
    throw new ValidationError('Dataset은 객체여야 합니다', 'dataset');
  }

  const d = dataset as Record<string, unknown>;

  // points 배열 검증
  if (!Array.isArray(d.points)) {
    throw new ValidationError('Dataset.points는 배열이어야 합니다', 'points');
  }

  // 각 포인트 검증
  d.points.forEach((point, index) => {
    try {
      validateDataPoint(point);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `Dataset.points[${index}] 검증 실패: ${error.message}`,
          `points[${index}]`
        );
      }
      throw error;
    }
  });
}

/**
 * AxisConfig 검증
 * @param axis - 검증할 축 설정
 * @throws {ValidationError} 검증 실패 시
 */
export function validateAxisConfig(axis: unknown): asserts axis is AxisConfig {
  if (axis === null || axis === undefined) {
    return; // 선택적 필드이므로 undefined/null은 허용
  }

  if (typeof axis !== 'object') {
    throw new ValidationError('AxisConfig는 객체여야 합니다', 'axis');
  }

  const a = axis as Record<string, unknown>;

  // min, max 검증 (각 경계를 독립적으로 검증 - 한쪽만 지정해도 NaN/Infinity/비숫자를 차단)
  if (a.min !== undefined) {
    if (typeof a.min !== 'number' || !Number.isFinite(a.min)) {
      throw new ValidationError('AxisConfig.min은 유한한 숫자여야 합니다', 'axis');
    }
  }

  if (a.max !== undefined) {
    if (typeof a.max !== 'number' || !Number.isFinite(a.max)) {
      throw new ValidationError('AxisConfig.max는 유한한 숫자여야 합니다', 'axis');
    }
  }

  // 두 경계가 모두 있을 때만 순서 검증
  if (a.min !== undefined && a.max !== undefined && a.min >= a.max) {
    throw new ValidationError('AxisConfig.min은 max보다 작아야 합니다', 'axis');
  }
}

/**
 * ChartConfig 검증
 * @param config - 검증할 차트 설정
 * @throws {ValidationError} 검증 실패 시
 */
export function validateChartConfig(config: unknown): asserts config is ChartConfig {
  if (config === null || config === undefined || typeof config !== 'object') {
    throw new ValidationError('ChartConfig는 객체여야 합니다', 'config');
  }

  const c = config as Record<string, unknown>;

  // type 검증
  if (c.type === null || c.type === undefined) {
    throw new ValidationError('ChartConfig.type은 필수입니다', 'type');
  }

  const validTypes = ['line', 'bar', 'pie', 'scatter'];
  if (!validTypes.includes(c.type as string)) {
    throw new ValidationError(
      `ChartConfig.type은 ${validTypes.join(', ')} 중 하나여야 합니다`,
      'type'
    );
  }

  // width, height 검증
  if (c.width !== undefined) {
    if (typeof c.width !== 'number' || c.width <= 0) {
      throw new ValidationError('ChartConfig.width는 양수여야 합니다', 'width');
    }
  }

  if (c.height !== undefined) {
    if (typeof c.height !== 'number' || c.height <= 0) {
      throw new ValidationError('ChartConfig.height는 양수여야 합니다', 'height');
    }
  }

  // colors 검증
  if (c.colors !== undefined) {
    if (!Array.isArray(c.colors)) {
      throw new ValidationError('ChartConfig.colors는 배열이어야 합니다', 'colors');
    }

    c.colors.forEach((color, index) => {
      if (typeof color !== 'string') {
        throw new ValidationError(
          `ChartConfig.colors[${index}]는 문자열이어야 합니다`,
          `colors[${index}]`
        );
      }

      // 간단한 CSS 색상 형식 검증 (hex, rgb, named colors 등)
      // 더 정확한 검증은 필요 시 추가
    });
  }

  // axes 검증
  if (c.axes !== undefined) {
    if (typeof c.axes !== 'object') {
      throw new ValidationError('ChartConfig.axes는 객체여야 합니다', 'axes');
    }

    const axes = c.axes as Record<string, unknown>;
    if (axes.x !== undefined) {
      validateAxisConfig(axes.x);
    }
    if (axes.y !== undefined) {
      validateAxisConfig(axes.y);
    }
  }
}
