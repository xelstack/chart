import { describe, it, expect } from 'vitest';
import {
  validateDataPoint,
  validateDataset,
  validateAxisConfig,
  validateChartConfig,
} from '../../src/utils/validation';
import { ValidationError } from '../../src/utils/errors';
import type { DataPoint, Dataset, ChartConfig, AxisConfig } from '../../src/types/index';

describe('validation', () => {
  describe('validateDataPoint', () => {
    it('should accept valid DataPoint', () => {
      const point: DataPoint = { x: 10, y: 20 };
      expect(() => validateDataPoint(point)).not.toThrow();
    });

    it('should accept Date as x value', () => {
      const point: DataPoint = { x: new Date(), y: 20 };
      expect(() => validateDataPoint(point)).not.toThrow();
    });

    it('should accept string as x value', () => {
      const point: DataPoint = { x: '2024-01-01', y: 20 };
      expect(() => validateDataPoint(point)).not.toThrow();
    });

    it('should reject null', () => {
      expect(() => validateDataPoint(null)).toThrow(ValidationError);
      expect(() => validateDataPoint(null)).toThrow('DataPoint는 객체여야 합니다');
    });

    it('should reject undefined', () => {
      expect(() => validateDataPoint(undefined)).toThrow(ValidationError);
    });

    it('should reject missing x', () => {
      const point = { y: 20 };
      expect(() => validateDataPoint(point)).toThrow(ValidationError);
      expect(() => validateDataPoint(point)).toThrow('DataPoint.x는 필수입니다');
    });

    it('should reject missing y', () => {
      const point = { x: 10 };
      expect(() => validateDataPoint(point)).toThrow(ValidationError);
      expect(() => validateDataPoint(point)).toThrow('DataPoint.y는 필수입니다');
    });

    it('should reject invalid x type', () => {
      const point = { x: true, y: 20 };
      expect(() => validateDataPoint(point)).toThrow(ValidationError);
      expect(() => validateDataPoint(point)).toThrow('number, string, 또는 Date여야 합니다');
    });

    it('should reject non-number y', () => {
      const point = { x: 10, y: 'invalid' };
      expect(() => validateDataPoint(point)).toThrow(ValidationError);
      expect(() => validateDataPoint(point)).toThrow('DataPoint.y는 number여야 합니다');
    });

    it('should reject NaN y', () => {
      const point = { x: 10, y: NaN };
      expect(() => validateDataPoint(point)).toThrow(ValidationError);
      expect(() => validateDataPoint(point)).toThrow('유한한 숫자여야 합니다');
    });

    it('should reject Infinity y', () => {
      const point = { x: 10, y: Infinity };
      expect(() => validateDataPoint(point)).toThrow(ValidationError);
    });
  });

  describe('validateDataset', () => {
    it('should accept valid Dataset', () => {
      const dataset: Dataset = {
        points: [
          { x: 1, y: 10 },
          { x: 2, y: 20 },
        ],
        name: 'Test Dataset',
      };
      expect(() => validateDataset(dataset)).not.toThrow();
    });

    it('should accept empty points array', () => {
      const dataset: Dataset = {
        points: [],
        name: 'Empty Dataset',
      };
      expect(() => validateDataset(dataset)).not.toThrow();
    });

    it('should reject null', () => {
      expect(() => validateDataset(null)).toThrow(ValidationError);
      expect(() => validateDataset(null)).toThrow('Dataset은 객체여야 합니다');
    });

    it('should reject non-array points', () => {
      const dataset = {
        points: 'invalid',
        name: 'Invalid',
      };
      expect(() => validateDataset(dataset)).toThrow(ValidationError);
      expect(() => validateDataset(dataset)).toThrow('Dataset.points는 배열이어야 합니다');
    });

    it('should reject invalid point in array', () => {
      const dataset = {
        points: [
          { x: 1, y: 10 },
          { x: 2, y: NaN }, // Invalid
        ],
        name: 'Invalid Dataset',
      };
      expect(() => validateDataset(dataset)).toThrow(ValidationError);
      expect(() => validateDataset(dataset)).toThrow('Dataset.points[1] 검증 실패');
    });
  });

  describe('validateAxisConfig', () => {
    it('should accept valid AxisConfig', () => {
      const axis: AxisConfig = {
        min: 0,
        max: 100,
        label: 'X Axis',
      };
      expect(() => validateAxisConfig(axis)).not.toThrow();
    });

    it('should accept undefined (optional)', () => {
      expect(() => validateAxisConfig(undefined)).not.toThrow();
    });

    it('should accept null (optional)', () => {
      expect(() => validateAxisConfig(null)).not.toThrow();
    });

    it('should reject non-object', () => {
      expect(() => validateAxisConfig('invalid')).toThrow(ValidationError);
      expect(() => validateAxisConfig('invalid')).toThrow('AxisConfig는 객체여야 합니다');
    });

    it('should reject non-number min/max', () => {
      const axis = {
        min: 'invalid',
        max: 100,
      };
      expect(() => validateAxisConfig(axis)).toThrow(ValidationError);
      expect(() => validateAxisConfig(axis)).toThrow('AxisConfig.min은 유한한 숫자여야 합니다');
    });

    it('should reject NaN min/max', () => {
      const axis = {
        min: NaN,
        max: 100,
      };
      expect(() => validateAxisConfig(axis)).toThrow(ValidationError);
      expect(() => validateAxisConfig(axis)).toThrow('유한한 숫자여야 합니다');
    });

    it('should reject min >= max', () => {
      const axis = {
        min: 100,
        max: 50,
      };
      expect(() => validateAxisConfig(axis)).toThrow(ValidationError);
      expect(() => validateAxisConfig(axis)).toThrow('AxisConfig.min은 max보다 작아야 합니다');
    });

    // 회귀: min/max 둘 다 있을 때만 검증해 한쪽만 지정된 잘못된 값이 통과하던 문제
    it('should reject a single invalid min even when max is omitted', () => {
      expect(() => validateAxisConfig({ min: NaN })).toThrow(ValidationError);
      expect(() => validateAxisConfig({ min: Infinity })).toThrow('AxisConfig.min은 유한한 숫자여야 합니다');
    });

    it('should reject a single invalid max even when min is omitted', () => {
      expect(() => validateAxisConfig({ max: 'oops' })).toThrow(ValidationError);
      expect(() => validateAxisConfig({ max: NaN })).toThrow('AxisConfig.max는 유한한 숫자여야 합니다');
    });

    it('should accept a single valid bound', () => {
      expect(() => validateAxisConfig({ min: 0 })).not.toThrow();
      expect(() => validateAxisConfig({ max: 100 })).not.toThrow();
    });
  });

  describe('validateChartConfig', () => {
    it('should accept valid ChartConfig', () => {
      const config: Partial<ChartConfig> = {
        type: 'line',
        width: 800,
        height: 600,
        colors: ['#ff0000', '#00ff00'],
      };
      expect(() => validateChartConfig(config)).not.toThrow();
    });

    it('should reject null', () => {
      expect(() => validateChartConfig(null)).toThrow(ValidationError);
      expect(() => validateChartConfig(null)).toThrow('ChartConfig는 객체여야 합니다');
    });

    it('should reject missing type', () => {
      const config = {
        width: 800,
        height: 600,
      };
      expect(() => validateChartConfig(config)).toThrow(ValidationError);
      expect(() => validateChartConfig(config)).toThrow('ChartConfig.type은 필수입니다');
    });

    it('should reject invalid type', () => {
      const config = {
        type: 'invalid',
      };
      expect(() => validateChartConfig(config)).toThrow(ValidationError);
      expect(() => validateChartConfig(config)).toThrow('line, bar, pie, scatter 중 하나여야 합니다');
    });

    it('should reject negative width', () => {
      const config = {
        type: 'line',
        width: -100,
      };
      expect(() => validateChartConfig(config)).toThrow(ValidationError);
      expect(() => validateChartConfig(config)).toThrow('ChartConfig.width는 양수여야 합니다');
    });

    it('should reject zero height', () => {
      const config = {
        type: 'line',
        height: 0,
      };
      expect(() => validateChartConfig(config)).toThrow(ValidationError);
      expect(() => validateChartConfig(config)).toThrow('ChartConfig.height는 양수여야 합니다');
    });

    it('should reject non-array colors', () => {
      const config = {
        type: 'line',
        colors: 'invalid',
      };
      expect(() => validateChartConfig(config)).toThrow(ValidationError);
      expect(() => validateChartConfig(config)).toThrow('ChartConfig.colors는 배열이어야 합니다');
    });

    it('should reject non-string color', () => {
      const config = {
        type: 'line',
        colors: ['#ff0000', 123],
      };
      expect(() => validateChartConfig(config)).toThrow(ValidationError);
      expect(() => validateChartConfig(config)).toThrow('ChartConfig.colors[1]는 문자열이어야 합니다');
    });

    it('should validate axes', () => {
      const config = {
        type: 'line',
        axes: {
          x: {
            min: 100,
            max: 50, // Invalid: min >= max
          },
        },
      };
      expect(() => validateChartConfig(config)).toThrow(ValidationError);
      expect(() => validateChartConfig(config)).toThrow('AxisConfig.min은 max보다 작아야 합니다');
    });
  });
});
