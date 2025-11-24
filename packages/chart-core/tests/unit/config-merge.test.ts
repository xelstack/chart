import { describe, it, expect } from 'vitest';
import { mergeConfig, deepMergeConfig } from '../../src/utils/config-merge';
import type { ChartConfig } from '../../src/types/index';

describe('config-merge', () => {
  describe('mergeConfig', () => {
    it('기본 설정과 오버라이드 설정을 병합해야 함', () => {
      const base: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
        colors: ['#3366ff'],
      };

      const override: Partial<ChartConfig> = {
        title: 'New Chart',
        colors: ['#ff3366'],
      };

      const merged = mergeConfig(base, override);

      expect(merged.type).toBe('line');
      expect(merged.width).toBe(800);
      expect(merged.height).toBe(600);
      expect(merged.title).toBe('New Chart');
      expect(merged.colors).toEqual(['#ff3366']);
    });

    it('원본 설정 객체를 변경하지 않아야 함 (불변성)', () => {
      const base: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const original = { ...base };
      mergeConfig(base, { title: 'New Title' });

      expect(base).toEqual(original);
      expect(base.title).toBeUndefined();
    });

    it('동일한 입력에 대해 항상 동일한 출력을 반환해야 함', () => {
      const base: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const override: Partial<ChartConfig> = {
        title: 'Test',
      };

      const merged1 = mergeConfig(base, override);
      const merged2 = mergeConfig(base, override);

      expect(merged1).toEqual(merged2);
    });

    it('빈 오버라이드는 원본 설정을 반환해야 함', () => {
      const base: ChartConfig = {
        type: 'line',
        width: 800,
        height: 600,
      };

      const merged = mergeConfig(base, {});

      expect(merged).toEqual(base);
      expect(merged).not.toBe(base); // 새로운 객체여야 함
    });

    it('불변성 검증: 중첩 객체도 불변해야 함', () => {
      const base: ChartConfig = {
        type: 'line',
        axes: {
          x: { min: 0 },
          y: { min: 0 },
        },
      };

      const originalAxes = base.axes;
      const merged = mergeConfig(base, { title: 'New Title' });

      expect(merged.axes).toBe(originalAxes); // 같은 참조여야 함 (얕은 복사)
      expect(merged.title).toBe('New Title');
    });
  });

  describe('deepMergeConfig', () => {
    it('중첩 객체를 깊게 병합해야 함', () => {
      const base: ChartConfig = {
        type: 'line',
        axes: {
          x: { min: 0, label: 'X Axis' },
          y: { min: 0 },
        },
      };

      const override: Partial<ChartConfig> = {
        axes: {
          x: { max: 100 },
        },
      };

      const merged = deepMergeConfig(base, override);

      expect(merged.axes?.x?.min).toBe(0);
      expect(merged.axes?.x?.max).toBe(100);
      expect(merged.axes?.x?.label).toBe('X Axis');
      expect(merged.axes?.y?.min).toBe(0);
    });

    it('원본 설정 객체를 변경하지 않아야 함 (불변성)', () => {
      const base: ChartConfig = {
        type: 'line',
        axes: {
          x: { min: 0 },
        },
      };

      const original = JSON.parse(JSON.stringify(base));
      deepMergeConfig(base, { axes: { x: { max: 100 } } });

      expect(base).toEqual(original);
    });

    it('불변성 검증: 원본 중첩 객체는 변경되지 않아야 함', () => {
      const base: ChartConfig = {
        type: 'line',
        axes: {
          x: { min: 0, label: 'X Axis' },
        },
      };

      const originalAxesX = base.axes?.x;
      const merged = deepMergeConfig(base, {
        axes: {
          x: { max: 100 },
        },
      });

      expect(base.axes?.x).toBe(originalAxesX); // 원본은 변경되지 않음
      expect(merged.axes?.x).not.toBe(originalAxesX); // 새로운 객체
      expect(merged.axes?.x?.min).toBe(0);
      expect(merged.axes?.x?.max).toBe(100);
    });
  });
});

