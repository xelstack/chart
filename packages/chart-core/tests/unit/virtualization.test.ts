import { describe, it, expect } from 'vitest';
import { virtualizeDataset, chunkDataset, calculateVirtualRange } from '../../src/utils/virtualization';
import type { DataPoint, Viewport } from '../../src/types/index';

describe('virtualization', () => {
  describe('virtualizeDataset', () => {
    it('빈 배열은 빈 가상화 데이터셋을 반환해야 함', () => {
      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1.0,
      };

      const result = virtualizeDataset([], viewport);

      expect(result.visiblePoints).toEqual([]);
      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it('뷰포트 범위 내의 포인트만 반환해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 50, y: 50 },
        { x: 100, y: 100 },
        { x: 150, y: 150 },
      ];

      const viewport: Viewport = {
        xMin: 25,
        xMax: 125,
        yMin: 25,
        yMax: 125,
        zoomLevel: 1.0,
      };

      const result = virtualizeDataset(points, viewport);

      expect(result.visiblePoints.length).toBeGreaterThan(0);
      result.visiblePoints.forEach((point) => {
        const x = typeof point.x === 'number' ? point.x : Number.parseFloat(String(point.x));
        expect(x).toBeGreaterThanOrEqual(viewport.xMin);
        expect(x).toBeLessThanOrEqual(viewport.xMax);
        expect(point.y).toBeGreaterThanOrEqual(viewport.yMin);
        expect(point.y).toBeLessThanOrEqual(viewport.yMax);
      });
    });

    it('최대 표시 개수를 초과하면 샘플링해야 함', () => {
      const points: DataPoint[] = Array.from({ length: 10000 }, (_, i) => ({
        x: i,
        y: i * 10,
      }));

      const viewport: Viewport = {
        xMin: 0,
        xMax: 10000,
        yMin: 0,
        yMax: 100000,
        zoomLevel: 1.0,
      };

      const result = virtualizeDataset(points, viewport, 100);

      expect(result.visiblePoints.length).toBeLessThanOrEqual(100);
      expect(result.totalCount).toBe(10000);
    });

    it('뷰포트 범위 밖의 데이터는 반환하지 않아야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 200, y: 200 },
      ];

      const viewport: Viewport = {
        xMin: 50,
        xMax: 150,
        yMin: 50,
        yMax: 150,
        zoomLevel: 1.0,
      };

      const result = virtualizeDataset(points, viewport);

      expect(result.visiblePoints.length).toBe(0);
      expect(result.totalCount).toBe(2);
    });

    // 회귀: maxVisiblePoints가 0/음수/비유한일 때 빈 결과를 반환하던 문제
    it.each([0, -1, NaN, Infinity])(
      'maxVisiblePoints가 %s여도 보이는 범위가 있으면 최소 1개 이상 반환해야 함',
      (maxVisiblePoints) => {
        const points: DataPoint[] = Array.from({ length: 50 }, (_, i) => ({ x: i, y: i }));
        const viewport: Viewport = { xMin: 0, xMax: 50, yMin: 0, yMax: 50, zoomLevel: 1.0 };

        const result = virtualizeDataset(points, viewport, maxVisiblePoints as number);

        expect(result.visiblePoints.length).toBeGreaterThanOrEqual(1);
        // 마지막 포인트가 항상 포함되어야 함
        expect(result.visiblePoints).toContainEqual(points[result.endIndex]);
      }
    );
  });

  describe('chunkDataset', () => {
    it('빈 배열은 빈 배열을 반환해야 함', () => {
      expect(chunkDataset([], 100)).toEqual([]);
    });

    it('데이터를 지정된 크기의 청크로 나눠야 함', () => {
      const points: DataPoint[] = Array.from({ length: 2500 }, (_, i) => ({
        x: i,
        y: i * 10,
      }));

      const chunks = chunkDataset(points, 1000);

      expect(chunks.length).toBe(3);
      expect(chunks[0].length).toBe(1000);
      expect(chunks[1].length).toBe(1000);
      expect(chunks[2].length).toBe(500);
    });

    it('청크 크기가 0 이하면 빈 배열을 반환해야 함', () => {
      const points: DataPoint[] = [{ x: 0, y: 10 }];
      expect(chunkDataset(points, 0)).toEqual([]);
      expect(chunkDataset(points, -1)).toEqual([]);
    });
  });

  describe('calculateVirtualRange', () => {
    it('가상 스크롤 범위를 올바르게 계산해야 함', () => {
      const result = calculateVirtualRange(1000, 500, 50, 0, 5);

      expect(result.start).toBeGreaterThanOrEqual(0);
      expect(result.end).toBeLessThanOrEqual(1000);
      expect(result.start).toBeLessThan(result.end);
      expect(result.totalHeight).toBe(50000);
    });

    it('스크롤 위치에 따라 범위가 변경되어야 함', () => {
      const result1 = calculateVirtualRange(1000, 500, 50, 0, 5);
      const result2 = calculateVirtualRange(1000, 500, 50, 1000, 5);

      expect(result1.start).toBeLessThan(result2.start);
      expect(result1.end).toBeLessThan(result2.end);
    });

    it('overscan이 적용되어야 함', () => {
      const result = calculateVirtualRange(1000, 500, 50, 1000, 10);

      // overscan으로 인해 시작 인덱스가 조정되어야 함
      expect(result.start).toBeLessThan(Math.floor(1000 / 50));
    });

    // 회귀: itemHeight가 0/음수/비유한일 때 NaN/Infinity 범위를 반환하던 문제
    it.each([0, -50, NaN, Infinity])(
      'itemHeight가 %s이면 안전한 빈 범위를 반환해야 함',
      (itemHeight) => {
        const result = calculateVirtualRange(1000, 500, itemHeight as number, 100, 5);

        expect(result).toEqual({ start: 0, end: 0, totalHeight: 0 });
        expect(Number.isNaN(result.start)).toBe(false);
        expect(Number.isNaN(result.end)).toBe(false);
      }
    );
  });
});

