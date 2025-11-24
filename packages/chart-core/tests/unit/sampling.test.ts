import { describe, it, expect } from 'vitest';
import { uniformSample, filterByViewport, adaptiveSample } from '../../src/utils/sampling';
import type { DataPoint } from '../../src/types/index';

describe('sampling', () => {
  describe('uniformSample', () => {
    it('빈 배열은 빈 배열을 반환해야 함', () => {
      expect(uniformSample([], 10)).toEqual([]);
    });

    it('목표 개수가 0 이하면 빈 배열을 반환해야 함', () => {
      const points: DataPoint[] = [{ x: 0, y: 10 }];
      expect(uniformSample(points, 0)).toEqual([]);
      expect(uniformSample(points, -1)).toEqual([]);
    });

    it('데이터 포인트가 목표 개수보다 적으면 모든 포인트를 반환해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];
      expect(uniformSample(points, 10)).toEqual(points);
    });

    it('데이터 포인트를 균등하게 샘플링해야 함', () => {
      const points: DataPoint[] = Array.from({ length: 100 }, (_, i) => ({
        x: i,
        y: i * 10,
      }));
      const sampled = uniformSample(points, 10);

      expect(sampled.length).toBe(10);
      expect(sampled[0]).toEqual(points[0]);
      expect(sampled[sampled.length - 1]).toEqual(points[points.length - 1]);
    });

    it('마지막 포인트는 항상 포함되어야 함', () => {
      const points: DataPoint[] = Array.from({ length: 100 }, (_, i) => ({
        x: i,
        y: i * 10,
      }));
      const sampled = uniformSample(points, 5);

      expect(sampled[sampled.length - 1]).toEqual(points[points.length - 1]);
    });
  });

  describe('filterByViewport', () => {
    it('뷰포트 범위 내의 포인트만 필터링해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 5, y: 20 },
        { x: 10, y: 30 },
        { x: 15, y: 40 },
      ];

      const filtered = filterByViewport(points, 3, 12, 15, 35);

      expect(filtered.length).toBe(2);
      expect(filtered[0]).toEqual(points[1]);
      expect(filtered[1]).toEqual(points[2]);
    });

    it('NaN 값은 필터링해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 'invalid', y: 20 },
        { x: 10, y: 30 },
      ];

      const filtered = filterByViewport(points, 0, 15, 0, 40);

      expect(filtered.length).toBe(2);
      expect(filtered.every((p) => p.x !== 'invalid')).toBe(true);
    });

    it('Date 타입의 X값도 처리해야 함', () => {
      const points: DataPoint[] = [
        { x: new Date(1000), y: 10 },
        { x: new Date(5000), y: 20 },
        { x: new Date(10000), y: 30 },
      ];

      const filtered = filterByViewport(points, 2000, 8000, 0, 40);

      expect(filtered.length).toBe(1);
      expect(filtered[0]).toEqual(points[1]);
    });
  });

  describe('adaptiveSample', () => {
    it('빈 배열은 빈 배열을 반환해야 함', () => {
      expect(adaptiveSample([], 10)).toEqual([]);
    });

    it('뷰포트가 지정된 경우 뷰포트 내 데이터만 샘플링해야 함', () => {
      const points: DataPoint[] = Array.from({ length: 100 }, (_, i) => ({
        x: i,
        y: i * 10,
      }));

      const sampled = adaptiveSample(points, 10, 20, 80);

      expect(sampled.length).toBe(10);
      sampled.forEach((point) => {
        const x = typeof point.x === 'number' ? point.x : Number.parseFloat(String(point.x));
        expect(x).toBeGreaterThanOrEqual(20);
        expect(x).toBeLessThanOrEqual(80);
      });
    });

    it('뷰포트 내 데이터가 없으면 전체 데이터를 사용해야 함', () => {
      const points: DataPoint[] = Array.from({ length: 10 }, (_, i) => ({
        x: i,
        y: i * 10,
      }));

      const sampled = adaptiveSample(points, 5, 100, 200);

      expect(sampled.length).toBeGreaterThan(0);
    });
  });
});

