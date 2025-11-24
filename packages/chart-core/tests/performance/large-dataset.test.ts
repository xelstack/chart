/**
 * 대용량 데이터셋 성능 벤치마크 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateLargeMultiSeriesDataset,
  estimateDatasetSize,
} from '../../src/utils/data-generation';

describe('Large Dataset Performance', () => {
  it('1,000 시리즈 * 1,000 포인트 생성 시간이 3초 이내여야 함', () => {
    const start = performance.now();

    generateLargeMultiSeriesDataset({
      seriesCount: 1000,
      pointsPerSeries: 1000,
    });

    const end = performance.now();
    const duration = end - start;

    console.log(
      `Generated 1M points in ${duration.toFixed(2)}ms`
    );

    expect(duration).toBeLessThan(3000);
  });

  it('500 시리즈 * 10,000 포인트 생성 시간이 5초 이내여야 함', () => {
    const start = performance.now();

    const dataset = generateLargeMultiSeriesDataset({
      seriesCount: 500,
      pointsPerSeries: 10000,
    });

    const end = performance.now();
    const duration = end - start;

    console.log(
      `Generated ${dataset.points.length.toLocaleString()} points in ${duration.toFixed(2)}ms`
    );

    expect(duration).toBeLessThan(5000);
  });

  it('메모리 사용량 추정이 정확해야 함', () => {
    const seriesCount = 100;
    const pointsPerSeries = 1000;

    const estimatedSize = estimateDatasetSize(seriesCount, pointsPerSeries);
    const dataset = generateLargeMultiSeriesDataset({
      seriesCount,
      pointsPerSeries,
    });

    // 실제 크기는 추정치의 ±30% 이내여야 함
    const actualSize = JSON.stringify(dataset).length;
    const ratio = actualSize / estimatedSize;

    console.log(`Estimated: ${(estimatedSize / 1024).toFixed(2)}KB`);
    console.log(`Actual: ${(actualSize / 1024).toFixed(2)}KB`);
    console.log(`Ratio: ${ratio.toFixed(2)}`);

    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(1.3);
  });

  it('대용량 데이터 생성 시 메모리 효율성 검증', () => {
    // 100 시리즈 * 10,000 포인트 = 100만 포인트 생성
    const dataset = generateLargeMultiSeriesDataset({
      seriesCount: 100,
      pointsPerSeries: 10000,
    });

    // 데이터셋이 올바르게 생성되었는지 확인
    expect(dataset.points).toHaveLength(1000000);

    // 모든 포인트가 유효한지 샘플링하여 확인
    const sampleSize = 1000;
    const step = Math.floor(dataset.points.length / sampleSize);

    for (let i = 0; i < dataset.points.length; i += step) {
      const point = dataset.points[i];
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(typeof point.y).toBe('number');
      expect(typeof point.series).toBe('string');
    }
  });
});
