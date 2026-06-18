/**
 * 증분 렌더링 / 생명주기 회귀 통합 테스트
 * A1 오프스크린 리사이즈, A2 append 이중 카운트, A4 use-after-destroy,
 * A5 updateData 재렌더+버퍼 동기화, A6 updateConfig 재렌더, A7 일시정지 중 유실,
 * C5 getIncrementalState.isActive
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChart } from '../../src/api/create-chart';
import type { Dataset, ChartConfig } from '../../src/types/index';

describe('Incremental rendering lifecycle (regression)', () => {
  let container: HTMLDivElement;
  let clearRectSpy: ReturnType<typeof vi.fn>;
  let createdCanvases: HTMLCanvasElement[];
  let rafSpy: ReturnType<typeof vi.fn>;
  let cancelRafSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();

    container = document.createElement('div');
    document.body.appendChild(container);

    const originalCreateElement = document.createElement.bind(document);
    clearRectSpy = vi.fn();
    createdCanvases = [];

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        const canvas = originalCreateElement('canvas') as HTMLCanvasElement;
        canvas.width = 800;
        canvas.height = 600;
        Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true });
        Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });

        const mockCtx = {
          canvas,
          clearRect: clearRectSpy,
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
        createdCanvases.push(canvas);
        return canvas;
      }
      return originalCreateElement(tagName);
    });

    let id = 0;
    rafSpy = vi.fn(() => ++id);
    cancelRafSpy = vi.fn();
    vi.stubGlobal('requestAnimationFrame', rafSpy);
    vi.stubGlobal('cancelAnimationFrame', cancelRafSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  const baseConfig: Partial<ChartConfig> = {
    type: 'line',
    width: 800,
    height: 600,
    responsive: false,
  };

  // A2: in-flight pending 포인트가 있는 상태에서 updateDataIncremental(append)이 이중 카운트하지 않음
  it('updateDataIncremental append가 in-flight 포인트를 이중 카운트하지 않아야 함', () => {
    const dataset: Dataset = { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] };
    const chart = createChart(container, dataset, baseConfig);

    // frameBuffering 기본 true: 프레임 예약만 되고 아직 실행되지 않음
    chart.addPointsIncremental([{ x: 2, y: 2 }]);
    // RAF 미실행 상태에서 전체 데이터로 배치 업데이트
    chart.updateDataIncremental([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);

    const state = chart.getState();
    expect(state.pointCount).toBe(4);
    expect(state.dataset?.points).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);
  });

  // A4 + C5: destroy 후 호출이 새 RAF 루프를 만들지 않고 상태는 비활성
  it('destroy 후 addPointsIncremental/resume는 새 RAF를 만들지 않아야 함', () => {
    const chart = createChart(container, { points: [{ x: 0, y: 0 }] }, baseConfig);
    chart.destroy();

    rafSpy.mockClear();
    chart.addPointsIncremental([{ x: 1, y: 1 }]);
    chart.resumeIncremental();

    expect(rafSpy).not.toHaveBeenCalled();
    expect(chart.getIncrementalState().isActive).toBe(false);
  });

  it('getIncrementalState.isActive는 destroy 전 true, 후 false여야 함', () => {
    const chart = createChart(container, { points: [{ x: 0, y: 0 }] }, baseConfig);
    expect(chart.getIncrementalState().isActive).toBe(true);
    chart.destroy();
    expect(chart.getIncrementalState().isActive).toBe(false);
  });

  // A5: updateData가 다시 렌더링하고 증분 버퍼를 동기화
  it('updateData는 다시 렌더링하고 이후 증분 델타가 새 데이터 기준으로 계산되어야 함', () => {
    const chart = createChart(
      container,
      { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
      baseConfig
    );

    clearRectSpy.mockClear();
    chart.updateData({ points: [{ x: 10, y: 10 }, { x: 11, y: 11 }] });

    expect(clearRectSpy).toHaveBeenCalled();
    expect(chart.getState().pointCount).toBe(2);

    // 동기화된 버퍼 기준으로 append -> 3개 (stale 버퍼였다면 잘못된 결과)
    chart.updateDataIncremental([
      { x: 10, y: 10 },
      { x: 11, y: 11 },
      { x: 12, y: 12 },
    ]);
    expect(chart.getState().pointCount).toBe(3);
    expect(chart.getState().dataset?.points).toEqual([
      { x: 10, y: 10 },
      { x: 11, y: 11 },
      { x: 12, y: 12 },
    ]);
  });

  // A6: updateConfig가 시각적 변경/크기 변경 시 다시 렌더링
  it('updateConfig는 색상 변경과 크기 변경 모두에서 다시 렌더링해야 함', () => {
    const chart = createChart(container, { points: [{ x: 0, y: 0 }] }, baseConfig);

    clearRectSpy.mockClear();
    chart.updateConfig({ colors: ['#ff0000'] });
    expect(clearRectSpy).toHaveBeenCalled();

    clearRectSpy.mockClear();
    chart.updateConfig({ width: 1000, height: 400 });
    expect(clearRectSpy).toHaveBeenCalled();
  });

  // A7: 일시정지 중 updateDataIncremental append 데이터가 유실되지 않음
  it('일시정지 중 updateDataIncremental append 데이터가 커밋되고 resume 시 다시 그려져야 함', () => {
    const chart = createChart(
      container,
      { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
      baseConfig
    );

    chart.pauseIncremental();
    chart.updateDataIncremental([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);

    // 일시정지 중에도 데이터는 커밋되어야 함 (유실 없음)
    expect(chart.getState().pointCount).toBe(3);

    clearRectSpy.mockClear();
    chart.resumeIncremental();
    expect(clearRectSpy).toHaveBeenCalled();
  });

  // B11: realtime.maxPoints가 0이면 slice(-0)로 인해 캡이 무력화되던 문제
  it('realtime.maxPoints가 0이면 데이터가 캡되어야 함', () => {
    const chart = createChart(
      container,
      { points: [{ x: 0, y: 0 }] },
      { ...baseConfig, realtime: { enabled: true, maxPoints: 0 } }
    );

    chart.addPoints([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);

    expect(chart.getState().pointCount).toBe(0);
  });

  // A1: 리사이즈 시 오프스크린 캔버스도 새 크기를 따라감
  it('resize 시 오프스크린 캔버스가 새 크기를 따라가야 함', () => {
    createChart(container, { points: [{ x: 0, y: 0 }] }, baseConfig);

    // 첫 번째 = 메인 캔버스, 두 번째 = 오프스크린 캔버스
    expect(createdCanvases.length).toBeGreaterThanOrEqual(2);
    const offscreen = createdCanvases[1];
    const dpr = window.devicePixelRatio || 1;

    expect(offscreen.width).toBe(800 * dpr);

    // 핸들을 통해 리사이즈
    const chart = createChart(container, { points: [{ x: 0, y: 0 }] }, baseConfig);
    const offscreen2 = createdCanvases[createdCanvases.length - 1];
    chart.resize(1234, 400);

    expect(offscreen2.width).toBe(1234 * dpr);
    expect(offscreen2.height).toBe(400 * dpr);
  });
});
