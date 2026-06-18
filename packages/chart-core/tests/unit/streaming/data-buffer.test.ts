/**
 * DataBuffer 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import { createDataBuffer } from '../../../src/streaming/data-buffer';
import type { DataPoint } from '../../../src/types/index';

describe('DataBuffer', () => {
  describe('createDataBuffer', () => {
    it('should create an empty buffer by default', () => {
      const buffer = createDataBuffer();

      expect(buffer.getCurrent()).toEqual([]);
      expect(buffer.getPending()).toEqual([]);
      expect(buffer.getTotalCount()).toBe(0);
    });

    it('should initialize with provided data', () => {
      const initialData: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      const buffer = createDataBuffer({ initialData });

      expect(buffer.getCurrent()).toEqual(initialData);
      expect(buffer.getPending()).toEqual([]);
      expect(buffer.getTotalCount()).toBe(2);
    });

    it('should initialize with maxPoints option', () => {
      const buffer = createDataBuffer({ maxPoints: 100 });
      const state = buffer.getState();

      expect(state.maxPoints).toBe(100);
    });
  });

  describe('addPoints', () => {
    it('should add points to pending buffer', () => {
      const buffer = createDataBuffer();
      const newPoints: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      buffer.addPoints(newPoints);

      expect(buffer.getCurrent()).toEqual([]);
      expect(buffer.getPending()).toEqual(newPoints);
    });

    it('should accumulate multiple addPoints calls', () => {
      const buffer = createDataBuffer();

      buffer.addPoints([{ x: 0, y: 10 }]);
      buffer.addPoints([{ x: 1, y: 20 }]);

      expect(buffer.getPending()).toEqual([
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ]);
    });

    it('should respect maxPoints limit', () => {
      const buffer = createDataBuffer({ maxPoints: 3 });

      buffer.addPoints([
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 30 },
        { x: 3, y: 40 },
        { x: 4, y: 50 },
      ]);

      // flush하면 maxPoints만큼만 유지
      buffer.flush();

      expect(buffer.getCurrent().length).toBe(3);
      // 최신 데이터가 유지되어야 함
      expect(buffer.getCurrent()[2]).toEqual({ x: 4, y: 50 });
    });
  });

  describe('flush', () => {
    it('should move pending data to current', () => {
      const buffer = createDataBuffer();

      buffer.addPoints([{ x: 0, y: 10 }]);
      const flushed = buffer.flush();

      expect(flushed).toEqual([{ x: 0, y: 10 }]);
      expect(buffer.getCurrent()).toEqual([{ x: 0, y: 10 }]);
      expect(buffer.getPending()).toEqual([]);
    });

    it('should append to existing current data', () => {
      const buffer = createDataBuffer({
        initialData: [{ x: 0, y: 10 }],
      });

      buffer.addPoints([{ x: 1, y: 20 }]);
      buffer.flush();

      expect(buffer.getCurrent()).toEqual([
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ]);
    });

    it('should return empty array when no pending data', () => {
      const buffer = createDataBuffer();
      const flushed = buffer.flush();

      expect(flushed).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear both current and pending data', () => {
      const buffer = createDataBuffer({
        initialData: [{ x: 0, y: 10 }],
      });

      buffer.addPoints([{ x: 1, y: 20 }]);
      buffer.clear();

      expect(buffer.getCurrent()).toEqual([]);
      expect(buffer.getPending()).toEqual([]);
      expect(buffer.getTotalCount()).toBe(0);
    });
  });

  describe('setMaxPoints', () => {
    it('should update maxPoints setting', () => {
      const buffer = createDataBuffer();

      buffer.setMaxPoints(50);

      expect(buffer.getState().maxPoints).toBe(50);
    });

    it('should trim existing data when reducing maxPoints', () => {
      const buffer = createDataBuffer({
        initialData: [
          { x: 0, y: 10 },
          { x: 1, y: 20 },
          { x: 2, y: 30 },
          { x: 3, y: 40 },
          { x: 4, y: 50 },
        ],
      });

      buffer.setMaxPoints(3);

      expect(buffer.getCurrent().length).toBe(3);
    });

    it('should allow undefined to remove limit', () => {
      const buffer = createDataBuffer({ maxPoints: 10 });

      buffer.setMaxPoints(undefined);

      expect(buffer.getState().maxPoints).toBeUndefined();
    });
  });

  describe('getState', () => {
    it('should return complete state snapshot', () => {
      const initialData: DataPoint[] = [{ x: 0, y: 10 }];
      const buffer = createDataBuffer({
        initialData,
        maxPoints: 100,
      });

      buffer.addPoints([{ x: 1, y: 20 }]);

      const state = buffer.getState();

      expect(state.current).toEqual(initialData);
      expect(state.pending).toEqual([{ x: 1, y: 20 }]);
      expect(state.maxPoints).toBe(100);
      expect(state.totalCount).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty addPoints call', () => {
      const buffer = createDataBuffer();

      buffer.addPoints([]);

      expect(buffer.getPending()).toEqual([]);
    });

    it('should handle readonly input arrays', () => {
      const buffer = createDataBuffer();
      const points: readonly DataPoint[] = [{ x: 0, y: 10 }];

      buffer.addPoints(points);

      expect(buffer.getPending()).toEqual([{ x: 0, y: 10 }]);
    });
  });

  // 회귀: getCurrent/getPending/getState가 내부 가변 배열을 그대로 노출하던 문제
  describe('defensive copies (regression)', () => {
    it('mutating the array returned by getCurrent should not affect internal state', () => {
      const buffer = createDataBuffer({ initialData: [{ x: 0, y: 10 }] });

      const current = buffer.getCurrent() as DataPoint[];
      current.push({ x: 99, y: 99 });

      expect(buffer.getCurrent()).toEqual([{ x: 0, y: 10 }]);
      expect(buffer.getTotalCount()).toBe(1);
    });

    it('mutating the array returned by getPending should not affect internal state', () => {
      const buffer = createDataBuffer();
      buffer.addPoints([{ x: 0, y: 10 }]);

      const pending = buffer.getPending() as DataPoint[];
      pending.push({ x: 99, y: 99 });

      expect(buffer.getPending()).toEqual([{ x: 0, y: 10 }]);
    });

    it('getState should return a true snapshot (mutation does not leak)', () => {
      const buffer = createDataBuffer({ initialData: [{ x: 0, y: 10 }] });
      buffer.addPoints([{ x: 1, y: 20 }]);

      const state = buffer.getState();
      (state.current as DataPoint[]).push({ x: 99, y: 99 });
      (state.pending as DataPoint[]).push({ x: 88, y: 88 });

      expect(buffer.getCurrent()).toEqual([{ x: 0, y: 10 }]);
      expect(buffer.getPending()).toEqual([{ x: 1, y: 20 }]);
    });
  });
});
