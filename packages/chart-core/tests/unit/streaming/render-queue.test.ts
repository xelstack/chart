/**
 * RenderQueue 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import { createRenderQueue } from '../../../src/streaming/render-queue';
import type { DataPoint } from '../../../src/types/index';

describe('RenderQueue', () => {
  describe('createRenderQueue', () => {
    it('should create an empty queue by default', () => {
      const queue = createRenderQueue();

      expect(queue.isEmpty()).toBe(true);
      expect(queue.getSize()).toBe(0);
    });
  });

  describe('enqueue', () => {
    it('should add points to the queue', () => {
      const queue = createRenderQueue();
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      queue.enqueue(points);

      expect(queue.isEmpty()).toBe(false);
      expect(queue.getSize()).toBe(2);
    });

    it('should accumulate multiple enqueue calls', () => {
      const queue = createRenderQueue();

      queue.enqueue([{ x: 0, y: 10 }]);
      queue.enqueue([{ x: 1, y: 20 }]);

      expect(queue.getSize()).toBe(2);
    });

    it('should update lastEnqueueTime', () => {
      const queue = createRenderQueue();

      queue.enqueue([{ x: 0, y: 10 }]);

      const state = queue.getState();
      expect(state.lastEnqueueTime).toBeDefined();
      expect(typeof state.lastEnqueueTime).toBe('number');
    });
  });

  describe('dequeueAll', () => {
    it('should return all queued items and clear queue', () => {
      const queue = createRenderQueue();
      const points: DataPoint[] = [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ];

      queue.enqueue(points);
      const dequeued = queue.dequeueAll();

      expect(dequeued).toEqual(points);
      expect(queue.isEmpty()).toBe(true);
      expect(queue.getSize()).toBe(0);
    });

    it('should return empty array when queue is empty', () => {
      const queue = createRenderQueue();
      const dequeued = queue.dequeueAll();

      expect(dequeued).toEqual([]);
    });

    it('should return items in FIFO order', () => {
      const queue = createRenderQueue();

      queue.enqueue([{ x: 0, y: 10 }]);
      queue.enqueue([{ x: 1, y: 20 }]);
      queue.enqueue([{ x: 2, y: 30 }]);

      const dequeued = queue.dequeueAll();

      expect(dequeued).toEqual([
        { x: 0, y: 10 },
        { x: 1, y: 20 },
        { x: 2, y: 30 },
      ]);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty queue', () => {
      const queue = createRenderQueue();

      expect(queue.isEmpty()).toBe(true);
    });

    it('should return false for non-empty queue', () => {
      const queue = createRenderQueue();
      queue.enqueue([{ x: 0, y: 10 }]);

      expect(queue.isEmpty()).toBe(false);
    });

    it('should return true after dequeueAll', () => {
      const queue = createRenderQueue();
      queue.enqueue([{ x: 0, y: 10 }]);
      queue.dequeueAll();

      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('getSize', () => {
    it('should return correct size', () => {
      const queue = createRenderQueue();

      expect(queue.getSize()).toBe(0);

      queue.enqueue([{ x: 0, y: 10 }]);
      expect(queue.getSize()).toBe(1);

      queue.enqueue([
        { x: 1, y: 20 },
        { x: 2, y: 30 },
      ]);
      expect(queue.getSize()).toBe(3);
    });
  });

  describe('clear', () => {
    it('should remove all items from queue', () => {
      const queue = createRenderQueue();
      queue.enqueue([
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ]);

      queue.clear();

      expect(queue.isEmpty()).toBe(true);
      expect(queue.getSize()).toBe(0);
    });
  });

  describe('getState', () => {
    it('should return complete state snapshot', () => {
      const queue = createRenderQueue();
      const points: DataPoint[] = [{ x: 0, y: 10 }];

      queue.enqueue(points);

      const state = queue.getState();

      expect(state.items).toEqual(points);
      expect(state.isEmpty).toBe(false);
      expect(state.size).toBe(1);
      expect(state.lastEnqueueTime).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty enqueue call', () => {
      const queue = createRenderQueue();

      queue.enqueue([]);

      expect(queue.isEmpty()).toBe(true);
    });

    it('should handle readonly input arrays', () => {
      const queue = createRenderQueue();
      const points: readonly DataPoint[] = [{ x: 0, y: 10 }];

      queue.enqueue(points);

      expect(queue.getSize()).toBe(1);
    });

    it('should handle multiple clear calls', () => {
      const queue = createRenderQueue();

      queue.clear();
      queue.clear();

      expect(queue.isEmpty()).toBe(true);
    });
  });

  // 회귀: maxSize 초과 시 가장 오래된 포인트가 조용히 폐기되던 문제 (손실 노출)
  describe('maxSize eviction (regression)', () => {
    it('should keep droppedCount at 0 when under maxSize', () => {
      const queue = createRenderQueue({ maxSize: 5 });

      queue.enqueue([
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ]);

      expect(queue.getState().droppedCount).toBe(0);
      expect(queue.getSize()).toBe(2);
    });

    it('should evict oldest items and report droppedCount when exceeding maxSize', () => {
      const queue = createRenderQueue({ maxSize: 3 });

      queue.enqueue([
        { x: 0, y: 0 },
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 },
        { x: 4, y: 40 },
      ]);

      const state = queue.getState();
      expect(state.size).toBe(3);
      expect(state.droppedCount).toBe(2);
      // 가장 최신 3개가 유지되어야 함
      expect(queue.dequeueAll()).toEqual([
        { x: 2, y: 20 },
        { x: 3, y: 30 },
        { x: 4, y: 40 },
      ]);
    });

    it('clear should reset droppedCount', () => {
      const queue = createRenderQueue({ maxSize: 1 });

      queue.enqueue([
        { x: 0, y: 0 },
        { x: 1, y: 10 },
      ]);
      expect(queue.getState().droppedCount).toBe(1);

      queue.clear();
      expect(queue.getState().droppedCount).toBe(0);
    });
  });
});
