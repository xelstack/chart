/**
 * RenderQueue 구현
 * 렌더링 대기열을 관리하는 큐
 * @module streaming/render-queue
 */

import type { DataPoint } from '@chart/types/index';
import type {
  CreateRenderQueueOptions,
  RenderQueue,
  RenderQueueState,
} from './types';

/**
 * RenderQueue 생성 함수
 * @param options 생성 옵션
 * @returns RenderQueue 인스턴스
 */
export function createRenderQueue(
  options: CreateRenderQueueOptions = {}
): RenderQueue {
  // 내부 상태 (mutable)
  let items: DataPoint[] = [];
  let lastEnqueueTime: number | undefined = undefined;
  let droppedCount = 0;
  const maxSize = options.maxSize;

  return {
    enqueue(points: readonly DataPoint[]): void {
      if (points.length === 0) return;

      // 큐에 추가
      items = [...items, ...points];
      lastEnqueueTime = performance.now();

      // maxSize 제한 적용 (오래된 항목 제거)
      // 주의: 백프레셔 상황에서 가장 오래된(아직 렌더되지 않은) 포인트가 폐기되므로
      // droppedCount로 손실을 노출하여 소비자가 감지할 수 있게 한다.
      if (maxSize !== undefined && items.length > maxSize) {
        droppedCount += items.length - maxSize;
        items = items.slice(items.length - maxSize);
      }
    },

    dequeueAll(): readonly DataPoint[] {
      const result = items;
      items = [];
      return result;
    },

    isEmpty(): boolean {
      return items.length === 0;
    },

    getSize(): number {
      return items.length;
    },

    clear(): void {
      items = [];
      lastEnqueueTime = undefined;
      droppedCount = 0;
    },

    getState(): RenderQueueState {
      return {
        items: [...items],
        isEmpty: items.length === 0,
        size: items.length,
        lastEnqueueTime,
        droppedCount,
      };
    },
  };
}
