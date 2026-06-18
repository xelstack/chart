/**
 * 함수형 프로그래밍 패턴 성능 테스트
 * 클래스 기반 vs 함수형 패턴 성능 비교
 * @module tests/performance/fp-performance
 */

import { describe, it, expect } from 'vitest';
import { calculateViewportFromDataset, calculateZoomedViewport } from '../../src/utils/viewport-calculations';
import { mergeConfig, deepMergeConfig } from '../../src/utils/config-merge';
import { filterPoints, sortPoints, mapPoints } from '../../src/utils/data-transforms';
import { pipe } from '../../src/utils/fp/pipe';
import { compose } from '../../src/utils/fp/compose';
import type { DataPoint, ChartConfig } from '../../src/types/index';

/**
 * 성능 측정 유틸리티
 */
function measurePerformance(fn: () => void, iterations = 1000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  return end - start;
}

/**
 * 큰 데이터셋 생성
 */
function generateLargeDataset(size: number): DataPoint[] {
  return Array.from({ length: size }, (_, i) => ({
    x: i,
    y: Math.sin(i / 100) * 100 + Math.random() * 20,
  }));
}

describe('FP Performance Tests', () => {
  describe('Viewport Calculations', () => {
    it('calculateViewportFromDataset should be fast for large datasets', () => {
      const largeDataset = generateLargeDataset(10000);

      const time = measurePerformance(() => {
        calculateViewportFromDataset(largeDataset);
      }, 100);

      // 100번 반복에 1초 이내 (평균 10ms 이하)
      expect(time).toBeLessThan(1000);
      console.log(`Viewport calculation (10K points, 100 iterations): ${time.toFixed(2)}ms`);
    });

    it('calculateZoomedViewport should be O(1)', () => {
      const viewport = {
        xMin: 0,
        xMax: 100,
        yMin: 0,
        yMax: 100,
        zoomLevel: 1.0,
      };

      const time = measurePerformance(() => {
        calculateZoomedViewport(viewport, 2.0);
      }, 10000);

      // 10000번 반복에 100ms 이내 (평균 0.01ms 이하)
      expect(time).toBeLessThan(100);
      console.log(`Zoom calculation (10K iterations): ${time.toFixed(2)}ms`);
    });
  });

  describe('Config Merge', () => {
    const baseConfig: ChartConfig = {
      type: 'line',
      width: 800,
      height: 600,
      colors: ['#ff0000'],
      showGrid: true,
    };

    const overrideConfig: Partial<ChartConfig> = {
      width: 1000,
      height: 800,
      colors: ['#00ff00'],
    };

    it('mergeConfig should be fast', () => {
      const time = measurePerformance(() => {
        mergeConfig(baseConfig, overrideConfig);
      }, 10000);

      // 10000번 반복에 50ms 이내 (평균 0.005ms 이하)
      expect(time).toBeLessThan(50);
      console.log(`Shallow merge (10K iterations): ${time.toFixed(2)}ms`);
    });

    it('deepMergeConfig should be reasonably fast', () => {
      const time = measurePerformance(() => {
        deepMergeConfig(baseConfig, overrideConfig);
      }, 10000);

      // 10000번 반복에 200ms 이내 (평균 0.02ms 이하)
      expect(time).toBeLessThan(200);
      console.log(`Deep merge (10K iterations): ${time.toFixed(2)}ms`);
    });
  });

  describe('Data Transforms', () => {
    const dataset = generateLargeDataset(10000);

    it('filterPoints should be fast', () => {
      const time = measurePerformance(() => {
        filterPoints(dataset, (p) => p.y > 50);
      }, 100);

      // 100번 반복에 500ms 이내
      expect(time).toBeLessThan(500);
      console.log(`Filter (10K points, 100 iterations): ${time.toFixed(2)}ms`);
    });

    it('sortPoints should be fast', () => {
      const time = measurePerformance(() => {
        sortPoints(dataset, (a, b) => a.y - b.y);
      }, 100);

      // 100번 반복에 1000ms 이내
      expect(time).toBeLessThan(1000);
      console.log(`Sort (10K points, 100 iterations): ${time.toFixed(2)}ms`);
    });

    it('mapPoints should be fast', () => {
      const time = measurePerformance(() => {
        mapPoints(dataset, (p) => ({ ...p, y: p.y * 2 }));
      }, 100);

      // 100번 반복에 500ms 이내
      expect(time).toBeLessThan(500);
      console.log(`Map (10K points, 100 iterations): ${time.toFixed(2)}ms`);
    });
  });

  describe('Function Composition', () => {
    const add1 = (x: number) => x + 1;
    const multiply2 = (x: number) => x * 2;
    const subtract3 = (x: number) => x - 3;

    it('pipe should have minimal overhead', () => {
      const composed = pipe(add1, multiply2, subtract3);

      const directTime = measurePerformance(() => {
        void subtract3(multiply2(add1(5)));
      }, 100000);

      const pipeTime = measurePerformance(() => {
        void composed(5);
      }, 100000);

      // pipe should be at most 15x slower than direct calls (test environment overhead, system load variability)
      const overhead = (pipeTime - directTime) / directTime;
      expect(overhead).toBeLessThan(15.0);

      console.log(`Direct calls (100K iterations): ${directTime.toFixed(2)}ms`);
      console.log(`Pipe calls (100K iterations): ${pipeTime.toFixed(2)}ms`);
      console.log(`Overhead: ${(overhead * 100).toFixed(1)}%`);
    });

    it('compose should have minimal overhead', () => {
      const composed = compose(subtract3, multiply2, add1);

      const directTime = measurePerformance(() => {
        void subtract3(multiply2(add1(5)));
      }, 100000);

      const composeTime = measurePerformance(() => {
        void composed(5);
      }, 100000);

      // compose should be at most 15x slower than direct calls (test environment overhead, system load variability)
      const overhead = (composeTime - directTime) / directTime;
      expect(overhead).toBeLessThan(15.0);

      console.log(`Direct calls (100K iterations): ${directTime.toFixed(2)}ms`);
      console.log(`Compose calls (100K iterations): ${composeTime.toFixed(2)}ms`);
      console.log(`Overhead: ${(overhead * 100).toFixed(1)}%`);
    });
  });

  describe('Combined Operations', () => {
    const dataset = generateLargeDataset(5000);

    it('chained operations should be performant', () => {
      const transformData = pipe(
        (points: DataPoint[]) => filterPoints(points, (p) => p.y > 50),
        (points: DataPoint[]) => sortPoints(points, (a, b) => {
          const xA = typeof a.x === 'number' ? a.x : 0;
          const xB = typeof b.x === 'number' ? b.x : 0;
          return xA - xB;
        }),
        (points: DataPoint[]) => mapPoints(points, (p) => ({ ...p, y: p.y * 1.1 }))
      );

      const time = measurePerformance(() => {
        transformData(dataset);
      }, 50);

      // 50번 반복에 2초 이내
      expect(time).toBeLessThan(2000);
      console.log(`Chained transforms (5K points, 50 iterations): ${time.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('pure functions should not leak memory', () => {
      const dataset = generateLargeDataset(1000);
      const iterations = 1000;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        const filtered = filterPoints(dataset, (p) => p.y > 50);
        const sorted = sortPoints(filtered, (a, b) => {
          const xA = typeof a.x === 'number' ? a.x : 0;
          const xB = typeof b.x === 'number' ? b.x : 0;
          return xA - xB;
        });
        void mapPoints(sorted, (p) => ({ ...p, y: p.y * 2 }));
      }

      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory increase should be less than 20MB after 1000 iterations (환경에 따라 변동 가능)
      expect(memoryIncrease).toBeLessThan(20);
      console.log(`Memory increase after ${iterations} iterations: ${memoryIncrease.toFixed(2)}MB`);
    });
  });
});

describe('Performance Regression Tests', () => {
  const BASELINE_THRESHOLDS = {
    viewportCalculation: 1000, // ms for 100 iterations with 10K points
    configMerge: 50, // ms for 10K iterations
    dataFilter: 500, // ms for 100 iterations with 10K points
    pipeOverhead: 5.0, // 5x max overhead (test environment)
  };

  it('viewport calculation should not regress', () => {
    const dataset = generateLargeDataset(10000);
    const time = measurePerformance(() => {
      calculateViewportFromDataset(dataset);
    }, 100);

    expect(time).toBeLessThan(BASELINE_THRESHOLDS.viewportCalculation);
  });

  it('config merge should not regress', () => {
    const baseConfig: ChartConfig = {
      type: 'line',
      width: 800,
      height: 600,
      colors: ['#ff0000'],
      showGrid: true,
    };
    const override: Partial<ChartConfig> = { width: 1000 };

    const time = measurePerformance(() => {
      mergeConfig(baseConfig, override);
    }, 10000);

    expect(time).toBeLessThan(BASELINE_THRESHOLDS.configMerge);
  });

  it('data filtering should not regress', () => {
    const dataset = generateLargeDataset(10000);
    const time = measurePerformance(() => {
      filterPoints(dataset, (p) => p.y > 50);
    }, 100);

    expect(time).toBeLessThan(BASELINE_THRESHOLDS.dataFilter);
  });

  it('pipe overhead should not regress', () => {
    const add1 = (x: number) => x + 1;
    const multiply2 = (x: number) => x * 2;
    const composed = pipe(add1, multiply2);

    const directTime = measurePerformance(() => {
      multiply2(add1(5));
    }, 100000);

    const pipeTime = measurePerformance(() => {
      composed(5);
    }, 100000);

    const overhead = (pipeTime - directTime) / directTime;
    expect(overhead).toBeLessThan(BASELINE_THRESHOLDS.pipeOverhead);
  });
});
