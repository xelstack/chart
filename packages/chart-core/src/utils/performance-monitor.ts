/**
 * 성능 모니터링 유틸리티
 * FPS, 메모리 사용량 등을 추적합니다.
 * @module utils/performance-monitor
 */

/**
 * 성능 메트릭
 */
export interface PerformanceMetrics {
  /** 현재 FPS */
  fps: number;
  /** 평균 FPS */
  averageFps: number;
  /** 메모리 사용량 (MB) */
  memoryUsage: number;
  /** 렌더링 시간 (밀리초) */
  renderTime: number;
  /** 평균 렌더링 시간 (밀리초) */
  averageRenderTime: number;
  /** 프레임 드롭 수 */
  frameDrops: number;
}

/**
 * 성능 모니터 클래스
 * 차트 렌더링 성능을 실시간으로 추적합니다.
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private fpsHistory: number[] = [];
  private renderTimeHistory: number[] = [];
  private frameDrops = 0;
  private lastRenderTime = 0;

  private readonly maxHistorySize = 60; // 1초치 (60fps 기준)
  private readonly targetFps = 60;

  /**
   * 프레임 시작 시점 기록
   * 렌더링 시작 전에 호출합니다.
   */
  startFrame(): void {
    this.lastTime = performance.now();
  }

  /**
   * 프레임 종료 시점 기록
   * 렌더링 완료 후에 호출합니다.
   */
  endFrame(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    // 렌더링 시간 기록
    this.lastRenderTime = deltaTime;
    this.renderTimeHistory.push(deltaTime);

    if (this.renderTimeHistory.length > this.maxHistorySize) {
      this.renderTimeHistory.shift();
    }

    // FPS 계산
    this.frameCount++;
    const fps = 1000 / deltaTime;
    this.fps = fps;
    this.fpsHistory.push(fps);

    if (this.fpsHistory.length > this.maxHistorySize) {
      this.fpsHistory.shift();
    }

    // 프레임 드롭 감지 (30fps 이하)
    if (fps < 30) {
      this.frameDrops++;
    }
  }

  /**
   * 현재 성능 메트릭 반환
   */
  getMetrics(): PerformanceMetrics {
    const averageFps =
      this.fpsHistory.length > 0
        ? this.fpsHistory.reduce((sum, fps) => sum + fps, 0) /
          this.fpsHistory.length
        : 0;

    const averageRenderTime =
      this.renderTimeHistory.length > 0
        ? this.renderTimeHistory.reduce((sum, time) => sum + time, 0) /
          this.renderTimeHistory.length
        : 0;

    // 메모리 사용량 (가능한 경우)
    const memoryUsage = this.getMemoryUsage();

    return {
      fps: Math.round(this.fps),
      averageFps: Math.round(averageFps),
      memoryUsage,
      renderTime: Math.round(this.lastRenderTime * 100) / 100,
      averageRenderTime: Math.round(averageRenderTime * 100) / 100,
      frameDrops: this.frameDrops,
    };
  }

  /**
   * 메모리 사용량 반환 (MB)
   * performance.memory API 사용 (Chrome/Edge만 지원)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as Performance & { memory: { usedJSHeapSize: number } }).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  /**
   * 통계 초기화
   */
  reset(): void {
    this.frameCount = 0;
    this.fps = 0;
    this.fpsHistory = [];
    this.renderTimeHistory = [];
    this.frameDrops = 0;
    this.lastRenderTime = 0;
  }

  /**
   * 성능 경고 여부 확인
   * 평균 FPS가 목표의 75% 미만이면 경고
   */
  hasPerformanceWarning(): boolean {
    const averageFps =
      this.fpsHistory.length > 0
        ? this.fpsHistory.reduce((sum, fps) => sum + fps, 0) /
          this.fpsHistory.length
        : this.targetFps;

    return averageFps < this.targetFps * 0.75;
  }
}

/**
 * 전역 성능 모니터 인스턴스
 */
let globalMonitor: PerformanceMonitor | null = null;

/**
 * 전역 성능 모니터 반환
 * 싱글톤 패턴으로 구현됩니다.
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  globalMonitor ??= new PerformanceMonitor();
  return globalMonitor;
}

/**
 * 성능 측정 유틸리티 함수
 * 함수 실행 시간을 측정합니다.
 *
 * @param fn - 측정할 함수
 * @param label - 레이블 (디버깅용)
 * @returns 함수 실행 결과
 *
 * @example
 * ```typescript
 * const result = measurePerformance(() => {
 *   // 무거운 작업
 *   return computeResult();
 * }, 'Heavy computation');
 * ```
 */
export function measurePerformance<T>(fn: () => T, label?: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  if (label !== undefined && label !== '') {
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
}

/**
 * 비동기 성능 측정 유틸리티 함수
 *
 * @param fn - 측정할 비동기 함수
 * @param label - 레이블 (디버깅용)
 * @returns 함수 실행 결과
 */
export async function measurePerformanceAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  if (label !== undefined && label !== '') {
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
}
