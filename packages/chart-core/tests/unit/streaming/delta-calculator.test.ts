/**
 * DeltaCalculator 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDelta,
  createDeltaCalculator,
} from '../../../src/streaming/delta-calculator';
import type { DataPoint } from '../../../src/types/index';

describe('calculateDelta', () => {
  describe('none case', () => {
    it('should return none when both arrays are empty', () => {
      const result = calculateDelta([], []);

      expect(result.type).toBe('none');
    });

    it('should return none when arrays are identical', () => {
      const current: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];
      const next: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      const result = calculateDelta(current, next);

      expect(result.type).toBe('none');
    });
  });

  describe('append case', () => {
    it('should detect append when new points are added at the end', () => {
      const current: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];
      const next: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 30 },
        { x: 3, y: 40 },
      ];

      const result = calculateDelta(current, next);

      expect(result.type).toBe('append');
      if (result.type === 'append') {
        expect(result.newPoints).toEqual([
          { x: 2, y: 30 },
          { x: 3, y: 40 },
        ]);
      }
    });

    it('should return append for empty current with any next', () => {
      const current: DataPoint[] = [];
      const next: DataPoint[] = [{ x: 0, y: 10 }];

      const result = calculateDelta(current, next);

      expect(result.type).toBe('append');
      if (result.type === 'append') {
        expect(result.newPoints).toEqual([{ x: 0, y: 10 }]);
      }
    });

    it('should handle single point append', () => {
      const current: DataPoint[] = [{ x: 0, y: 10 }];
      const next: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      const result = calculateDelta(current, next);

      expect(result.type).toBe('append');
      if (result.type === 'append') {
        expect(result.newPoints).toEqual([{ x: 1, y: 20 }]);
      }
    });
  });

  describe('prepend case', () => {
    it('should detect prepend when new points are added at the beginning', () => {
      const current: DataPoint[] = [
        { x: 2, y: 30 },
        { x: 3, y: 40 },
      ];
      const next: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 30 },
        { x: 3, y: 40 },
      ];

      const result = calculateDelta(current, next);

      expect(result.type).toBe('prepend');
      if (result.type === 'prepend') {
        expect(result.newPoints).toEqual([
          { x: 0, y: 10 },
          { x: 1, y: 20 },
        ]);
      }
    });

    it('should skip prepend check when option is set', () => {
      const current: DataPoint[] = [
        { x: 2, y: 30 },
        { x: 3, y: 40 },
      ];
      const next: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 30 },
        { x: 3, y: 40 },
      ];

      const result = calculateDelta(current, next, { skipPrependCheck: true });

      // prepend 체크를 스킵하면 replace로 처리됨
      expect(result.type).toBe('replace');
    });
  });

  describe('replace case', () => {
    it('should return replace when data changes in the middle', () => {
      const current: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];
      const next: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 99 }, // y value changed
      ];

      const result = calculateDelta(current, next);

      expect(result.type).toBe('replace');
      if (result.type === 'replace') {
        expect(result.points).toEqual(next);
      }
    });

    it('should return replace when data is completely different', () => {
      const current: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];
      const next: DataPoint[] = [
        { x: 100, y: 200 },
        { x: 101, y: 201 },
      ];

      const result = calculateDelta(current, next);

      expect(result.type).toBe('replace');
    });

    it('should return replace with empty points when next is empty', () => {
      const current: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];
      const next: DataPoint[] = [];

      const result = calculateDelta(current, next);

      expect(result.type).toBe('replace');
      if (result.type === 'replace') {
        expect(result.points).toEqual([]);
      }
    });

    it('should return replace when next is shorter than current', () => {
      const current: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 30 },
      ];
      const next: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      const result = calculateDelta(current, next);

      expect(result.type).toBe('replace');
    });
  });

  describe('series handling', () => {
    it('should correctly compare points with series', () => {
      const current: DataPoint[] = [
        { x: 0, y: 10, series: 'A' },
        { x: 1, y: 20, series: 'A' },
      ];
      const next: DataPoint[] = [
        { x: 0, y: 10, series: 'A' },
        { x: 1, y: 20, series: 'A' },
        { x: 2, y: 30, series: 'A' },
      ];

      const result = calculateDelta(current, next);

      expect(result.type).toBe('append');
    });

    it('should detect replace when series changes', () => {
      const current: DataPoint[] = [
        { x: 0, y: 10, series: 'A' },
      ];
      const next: DataPoint[] = [
        { x: 0, y: 10, series: 'B' },
      ];

      const result = calculateDelta(current, next);

      expect(result.type).toBe('replace');
    });
  });
});

describe('createDeltaCalculator', () => {
  it('should create calculator with empty initial data', () => {
    const calculator = createDeltaCalculator();

    expect(calculator.getCurrent()).toEqual([]);
  });

  it('should create calculator with initial data', () => {
    const initialData: DataPoint[] = [{ x: 0, y: 10 }];
    const calculator = createDeltaCalculator({ initialData });

    expect(calculator.getCurrent()).toEqual(initialData);
  });

  describe('calculate', () => {
    it('should calculate delta and update current', () => {
      const calculator = createDeltaCalculator({
        initialData: [{ x: 0, y: 10 }],
      });

      const result = calculator.calculate([
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ]);

      expect(result.type).toBe('append');
      expect(calculator.getCurrent()).toEqual([
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ]);
    });

    it('should not update current on none result', () => {
      const calculator = createDeltaCalculator({
        initialData: [{ x: 0, y: 10 }],
      });

      const result = calculator.calculate([{ x: 0, y: 10 }]);

      expect(result.type).toBe('none');
      expect(calculator.getCurrent()).toEqual([{ x: 0, y: 10 }]);
    });
  });

  describe('setCurrent', () => {
    it('should directly set current data', () => {
      const calculator = createDeltaCalculator();

      calculator.setCurrent([{ x: 0, y: 10 }]);

      expect(calculator.getCurrent()).toEqual([{ x: 0, y: 10 }]);
    });
  });

  describe('clear', () => {
    it('should reset calculator to empty state', () => {
      const calculator = createDeltaCalculator({
        initialData: [{ x: 0, y: 10 }],
      });

      calculator.clear();

      expect(calculator.getCurrent()).toEqual([]);
    });
  });
});
