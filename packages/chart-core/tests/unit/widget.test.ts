/**
 * 위젯 회귀 테스트
 * C1 getState 최신 pointCount, C2 잘못된 config 거부, C3 autoResize 매핑
 */
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { createWidget } from '../../src/widget/widget';
import type { WidgetConfig } from '../../src/types/index';

describe('createWidget (regression)', () => {
  let container: HTMLDivElement;
  let resizeObserverCtor: Mock;
  let observeSpy: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();

    container = document.createElement('div');
    document.body.appendChild(container);

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        const canvas = originalCreateElement('canvas') as HTMLCanvasElement;
        Object.defineProperty(canvas, 'clientWidth', { value: 400, configurable: true });
        Object.defineProperty(canvas, 'clientHeight', { value: 300, configurable: true });
        const mockCtx = {
          canvas,
          clearRect: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          strokeStyle: '',
          fillStyle: '',
          lineWidth: 0,
          font: '',
          textAlign: '',
          textBaseline: '',
          globalAlpha: 1,
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          stroke: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          fillRect: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn(() => ({ width: 50 })),
          drawImage: vi.fn(),
        } as unknown as CanvasRenderingContext2D;
        vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx);
        return canvas;
      }
      return originalCreateElement(tagName);
    });

    observeSpy = vi.fn();
    resizeObserverCtor = vi.fn();
    class ResizeObserverMock {
      observe = observeSpy;
      disconnect = vi.fn();
      unobserve = vi.fn();
      constructor() {
        resizeObserverCtor();
      }
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  // C1: getState().pointCount가 updateData 후에도 실제 카운트를 반영
  it('getState().pointCount는 updateData 후 최신 값을 반영해야 함', () => {
    const widget = createWidget({
      container,
      dataset: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
      chartConfig: { type: 'line', width: 400, height: 300 },
    });

    expect(widget.getState().pointCount).toBe(2);

    widget.updateData({
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
      ],
    });

    expect(widget.getState().pointCount).toBe(5);
  });

  // C2: 잘못된 WidgetConfig(container 없음)는 명확한 에러로 거부
  it('container가 없는 잘못된 WidgetConfig는 명확한 에러를 던져야 함', () => {
    const bad = {
      dataset: { points: [] },
      chartConfig: { type: 'line' },
    } as unknown as WidgetConfig;

    expect(() => createWidget(bad)).toThrow('유효하지 않은 WidgetConfig');
  });

  // C3: autoResize 옵션이 ResizeObserver 설치 여부를 제어
  it('autoResize:false면 ResizeObserver를 설치하지 않아야 함', () => {
    createWidget({
      container,
      dataset: { points: [{ x: 0, y: 0 }] },
      chartConfig: { type: 'line', width: 400, height: 300 },
      autoResize: false,
    });

    expect(resizeObserverCtor).not.toHaveBeenCalled();
  });

  it('autoResize 기본값이면 ResizeObserver를 설치해야 함', () => {
    createWidget({
      container,
      dataset: { points: [{ x: 0, y: 0 }] },
      chartConfig: { type: 'line', width: 400, height: 300 },
    });

    expect(resizeObserverCtor).toHaveBeenCalled();
    expect(observeSpy).toHaveBeenCalledWith(container);
  });
});
