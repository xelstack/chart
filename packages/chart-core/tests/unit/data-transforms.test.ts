import { describe, it, expect } from 'vitest';
import { filterPoints, sortPoints, mapPoints } from '../../src/utils/data-transforms';
import type { DataPoint } from '../../src/types/index';

describe('data-transforms', () => {
  describe('filterPoints', () => {
    it('조건에 맞는 포인트만 필터링해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 15 },
        { x: 3, y: 25 },
      ];

      const filtered = filterPoints(points, (p) => p.y > 15);

      expect(filtered.length).toBe(2);
      expect(filtered[0]).toEqual(points[1]);
      expect(filtered[1]).toEqual(points[3]);
    });

    it('원본 배열을 변경하지 않아야 함 (불변성)', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      const original = [...points];
      filterPoints(points, (p) => p.y > 15);

      expect(points).toEqual(original);
    });

    it('빈 배열은 빈 배열을 반환해야 함', () => {
      const filtered = filterPoints([], (p) => p.y > 0);
      expect(filtered).toEqual([]);
    });

    it('동일한 입력에 대해 항상 동일한 출력을 반환해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      const filtered1 = filterPoints(points, (p) => p.y > 15);
      const filtered2 = filterPoints(points, (p) => p.y > 15);

      expect(filtered1).toEqual(filtered2);
    });

    it('불변성 검증: 원본 배열의 요소도 변경되지 않아야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      const originalPoint = points[0];
      const filtered = filterPoints(points, (p) => p.y > 15);

      expect(points[0]).toBe(originalPoint); // 같은 참조
      expect(filtered.length).toBe(1);
    });
  });

  describe('sortPoints', () => {
    it('X축 기준으로 정렬해야 함 (기본)', () => {
      const points: DataPoint[] = [
        { x: 3, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 15 },
      ];

      const sorted = sortPoints(points);

      expect(sorted[0].x).toBe(1);
      expect(sorted[1].x).toBe(2);
      expect(sorted[2].x).toBe(3);
    });

    it('커스텀 비교 함수를 사용할 수 있어야 함', () => {
      const points: DataPoint[] = [
        { x: 1, y: 30 },
        { x: 2, y: 10 },
        { x: 3, y: 20 },
      ];

      const sorted = sortPoints(points, (a, b) => a.y - b.y);

      expect(sorted[0].y).toBe(10);
      expect(sorted[1].y).toBe(20);
      expect(sorted[2].y).toBe(30);
    });

    it('원본 배열을 변경하지 않아야 함 (불변성)', () => {
      const points: DataPoint[] = [
        { x: 3, y: 10 },
        { x: 1, y: 20 },
      ];

      const original = [...points];
      sortPoints(points);

      expect(points).toEqual(original);
    });

    it('불변성 검증: 정렬된 배열은 새로운 배열이어야 함', () => {
      const points: DataPoint[] = [
        { x: 3, y: 10 },
        { x: 1, y: 20 },
      ];

      const sorted = sortPoints(points);

      expect(sorted).not.toBe(points); // 새로운 배열
      expect(points[0].x).toBe(3); // 원본은 변경되지 않음
    });
  });

  describe('mapPoints', () => {
    it('각 포인트를 변환해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      const transformed = mapPoints(points, (p) => ({ ...p, y: p.y * 2 }));

      expect(transformed[0].y).toBe(20);
      expect(transformed[1].y).toBe(40);
      expect(transformed[0].x).toBe(0);
      expect(transformed[1].x).toBe(1);
    });

    it('원본 배열을 변경하지 않아야 함 (불변성)', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      const original = [...points];
      mapPoints(points, (p) => ({ ...p, y: p.y * 2 }));

      expect(points).toEqual(original);
    });

    it('동일한 입력에 대해 항상 동일한 출력을 반환해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      const transform = (p: DataPoint) => ({ ...p, y: p.y * 2 });
      const transformed1 = mapPoints(points, transform);
      const transformed2 = mapPoints(points, transform);

      expect(transformed1).toEqual(transformed2);
    });

    it('불변성 검증: 변환된 배열은 새로운 배열이어야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      const transformed = mapPoints(points, (p) => ({ ...p, y: p.y * 2 }));

      expect(transformed).not.toBe(points); // 새로운 배열
      expect(points[0].y).toBe(10); // 원본은 변경되지 않음
    });
  });
});

