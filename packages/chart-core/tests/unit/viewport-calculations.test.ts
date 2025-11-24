import { describe, it, expect } from 'vitest';
import {
  calculateViewportFromDataset,
  calculateZoomedViewport,
  calculatePannedViewport,
} from '../../src/utils/viewport-calculations';
import type { DataPoint, Viewport } from '../../src/types/index';

describe('viewport-calculations', () => {
  describe('calculateViewportFromDataset', () => {
    it('빈 배열은 기본 뷰포트를 반환해야 함', () => {
      const viewport = calculateViewportFromDataset([]);
      expect(viewport.xMin).toBeLessThanOrEqual(0);
      expect(viewport.xMax).toBeGreaterThanOrEqual(100);
      expect(viewport.yMin).toBeLessThanOrEqual(0);
      expect(viewport.yMax).toBeGreaterThanOrEqual(100);
      expect(viewport.zoomLevel).toBe(1.0);
    });

    it('데이터셋으로부터 뷰포트를 계산해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 10, y: 20 },
        { x: 20, y: 15 },
      ];

      const viewport = calculateViewportFromDataset(points);

      expect(viewport.xMin).toBeLessThanOrEqual(0);
      expect(viewport.xMax).toBeGreaterThanOrEqual(20);
      expect(viewport.yMin).toBeLessThanOrEqual(10);
      expect(viewport.yMax).toBeGreaterThanOrEqual(20);
      expect(viewport.zoomLevel).toBe(1.0);
    });

    it('동일한 입력에 대해 항상 동일한 출력을 반환해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 10, y: 20 },
      ];

      const viewport1 = calculateViewportFromDataset(points);
      const viewport2 = calculateViewportFromDataset(points);

      expect(viewport1).toEqual(viewport2);
    });

    it('여백(padding)을 포함해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 10, y: 20 },
      ];

      const viewport = calculateViewportFromDataset(points, 0.1);

      expect(viewport.xMin).toBeLessThan(0);
      expect(viewport.xMax).toBeGreaterThan(10);
      expect(viewport.yMin).toBeLessThan(10);
      expect(viewport.yMax).toBeGreaterThan(20);
    });

    it('모든 y값이 같을 때도 유효한 뷰포트를 반환해야 함', () => {
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 10, y: 10 },
        { x: 20, y: 10 },
      ];

      const viewport = calculateViewportFromDataset(points);

      expect(viewport.yMin).toBeLessThanOrEqual(10);
      expect(viewport.yMax).toBeGreaterThanOrEqual(10);
      expect(viewport.yMax - viewport.yMin).toBeGreaterThan(0);
    });
  });

  describe('calculateZoomedViewport', () => {
    it('뷰포트를 확대해야 함', () => {
      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1.0,
      };

      const zoomed = calculateZoomedViewport(viewport, 2.0);

      expect(zoomed.zoomLevel).toBe(2.0);
      expect(zoomed.xMax - zoomed.xMin).toBeLessThan(viewport.xMax - viewport.xMin);
      expect(zoomed.yMax - zoomed.yMin).toBeLessThan(viewport.yMax - viewport.yMin);
    });

    it('뷰포트를 축소해야 함', () => {
      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1.0,
      };

      const zoomed = calculateZoomedViewport(viewport, 0.5);

      expect(zoomed.zoomLevel).toBe(0.5);
      expect(zoomed.xMax - zoomed.xMin).toBeGreaterThan(viewport.xMax - viewport.xMin);
      expect(zoomed.yMax - zoomed.yMin).toBeGreaterThan(viewport.yMax - viewport.yMin);
    });

    it('중심점 기준으로 확대/축소해야 함', () => {
      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1.0,
      };

      const zoomed = calculateZoomedViewport(viewport, 2.0, 50, 50);

      const centerX = (zoomed.xMin + zoomed.xMax) / 2;
      const centerY = (zoomed.yMin + zoomed.yMax) / 2;

      expect(centerX).toBeCloseTo(50, 1);
      expect(centerY).toBeCloseTo(50, 1);
    });

    it('원본 뷰포트를 변경하지 않아야 함 (불변성)', () => {
      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1.0,
      };

      const original = { ...viewport };
      calculateZoomedViewport(viewport, 2.0);

      expect(viewport).toEqual(original);
    });

    it('불변성 검증: 반환된 뷰포트는 새로운 객체여야 함', () => {
      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1.0,
      };

      const zoomed = calculateZoomedViewport(viewport, 2.0);

      expect(zoomed).not.toBe(viewport); // 새로운 객체
      expect(viewport.zoomLevel).toBe(1.0); // 원본은 변경되지 않음
    });
  });

  describe('calculatePannedViewport', () => {
    it('뷰포트를 이동해야 함', () => {
      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1.0,
      };

      const panned = calculatePannedViewport(viewport, 50, 30);

      expect(panned.xMin).toBe(50);
      expect(panned.xMax).toBe(150);
      expect(panned.yMin).toBe(30);
      expect(panned.yMax).toBe(130);
      expect(panned.zoomLevel).toBe(viewport.zoomLevel);
    });

    it('음수 방향으로 이동할 수 있어야 함', () => {
      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1.0,
      };

      const panned = calculatePannedViewport(viewport, -50, -30);

      expect(panned.xMin).toBe(-50);
      expect(panned.xMax).toBe(50);
      expect(panned.yMin).toBe(-30);
      expect(panned.yMax).toBe(70);
    });

    it('원본 뷰포트를 변경하지 않아야 함 (불변성)', () => {
      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1.0,
      };

      const original = { ...viewport };
      calculatePannedViewport(viewport, 50, 30);

      expect(viewport).toEqual(original);
    });

    it('불변성 검증: 반환된 뷰포트는 새로운 객체여야 함', () => {
      const viewport: Viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1.0,
      };

      const panned = calculatePannedViewport(viewport, 50, 30);

      expect(panned).not.toBe(viewport); // 새로운 객체
      expect(viewport.xMin).toBe(0); // 원본은 변경되지 않음
    });
  });
});

