/**
 * 대용량 데이터 생성 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateLargeMultiSeriesDataset,
  createSeriesGenerator,
  generateRealtimePoints,
  estimateDatasetSize,
} from '../../src/utils/data-generation';

describe('Data Generation', () => {
  describe('generateLargeMultiSeriesDataset', () => {
    it('지정된 시리즈 수와 포인트 수로 데이터셋을 생성해야 함', () => {
      const dataset = generateLargeMultiSeriesDataset({
        seriesCount: 10,
        pointsPerSeries: 100,
      });

      expect(dataset.points).toHaveLength(10 * 100);
    });

    it('각 포인트는 x, y, series 필드를 가져야 함', () => {
      const dataset = generateLargeMultiSeriesDataset({
        seriesCount: 2,
        pointsPerSeries: 10,
      });

      for (const point of dataset.points) {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('series');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(typeof point.series).toBe('string');
      }
    });

    it('시리즈 이름은 접두사와 번호로 구성되어야 함', () => {
      const dataset = generateLargeMultiSeriesDataset({
        seriesCount: 3,
        pointsPerSeries: 2,
        seriesPrefix: 'Test',
      });

      const uniqueSeries = new Set(dataset.points.map((p) => p.series));
      expect(uniqueSeries.size).toBe(3);
      expect(uniqueSeries.has('Test 1')).toBe(true);
      expect(uniqueSeries.has('Test 2')).toBe(true);
      expect(uniqueSeries.has('Test 3')).toBe(true);
    });

    it('기본 옵션으로 500개 시리즈 * 10,000 포인트 생성 가능해야 함', () => {
      const dataset = generateLargeMultiSeriesDataset();

      expect(dataset.points).toHaveLength(500 * 10000);
    });

    it('다양한 패턴으로 데이터 생성 가능해야 함', () => {
      const patterns = ['sine', 'random', 'linear', 'exponential'] as const;

      for (const pattern of patterns) {
        const dataset = generateLargeMultiSeriesDataset({
          seriesCount: 2,
          pointsPerSeries: 10,
          pattern,
        });

        expect(dataset.points).toHaveLength(20);
      }
    });
  });

  describe('createSeriesGenerator', () => {
    it('sine 패턴 생성기는 사인파 형태의 값을 생성해야 함', () => {
      const generator = createSeriesGenerator('sine', 0);
      const values = Array.from({ length: 400 }, (_, i) =>
        generator(0, i)
      );

      // 사인파는 주기적으로 변동해야 함 (Math.sin 범위 [-1, 1] * 50 = [-50, 50])
      const min = Math.min(...values);
      const max = Math.max(...values);
      expect(max - min).toBeGreaterThan(80); // 전체 진폭의 80% 이상
    });

    it('random 패턴 생성기는 0-100 사이의 값을 생성해야 함', () => {
      const generator = createSeriesGenerator('random', 0);
      const values = Array.from({ length: 100 }, (_, i) =>
        generator(0, i)
      );

      for (const value of values) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });

    it('linear 패턴 생성기는 선형 증가하는 값을 생성해야 함', () => {
      const generator = createSeriesGenerator('linear', 0);
      const values = Array.from({ length: 10 }, (_, i) =>
        generator(0, i * 10)
      );

      // 선형 증가 확인 (노이즈 없음)
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });

    it('노이즈 레벨이 적용되어야 함', () => {
      const generatorNoNoise = createSeriesGenerator('linear', 0);
      const generatorWithNoise = createSeriesGenerator('linear', 10);

      const valuesNoNoise = Array.from({ length: 100 }, (_, i) =>
        generatorNoNoise(0, i)
      );
      const valuesWithNoise = Array.from({ length: 100 }, (_, i) =>
        generatorWithNoise(0, i)
      );

      // 노이즈가 있는 경우 표준편차가 더 커야 함
      const stdNoNoise = calculateStd(valuesNoNoise);
      const stdWithNoise = calculateStd(valuesWithNoise);

      expect(stdWithNoise).toBeGreaterThan(stdNoNoise);
    });
  });

  describe('generateRealtimePoints', () => {
    it('지정된 시리즈 수만큼 포인트를 생성해야 함', () => {
      const generator = createSeriesGenerator('sine', 10);
      const points = generateRealtimePoints(100, 50, generator);

      expect(points).toHaveLength(50);
    });

    it('모든 포인트의 x 값은 현재 시간과 같아야 함', () => {
      const generator = createSeriesGenerator('sine', 10);
      const currentTime = 1000;
      const points = generateRealtimePoints(currentTime, 10, generator);

      for (const point of points) {
        expect(point.x).toBe(currentTime);
      }
    });

    it('각 포인트는 서로 다른 시리즈 이름을 가져야 함', () => {
      const generator = createSeriesGenerator('sine', 10);
      const points = generateRealtimePoints(100, 5, generator, 'Series');

      const seriesNames = points.map((p) => p.series);
      const uniqueNames = new Set(seriesNames);

      expect(uniqueNames.size).toBe(5);
    });
  });

  describe('estimateDatasetSize', () => {
    it('데이터셋 크기를 바이트 단위로 추정해야 함', () => {
      const size = estimateDatasetSize(10, 100);

      // 10 시리즈 * 100 포인트 * ~68 bytes = ~68,000 bytes
      expect(size).toBeGreaterThan(60000);
      expect(size).toBeLessThan(80000);
    });

    it('500 시리즈 * 10,000 포인트는 약 340MB로 추정되어야 함', () => {
      const size = estimateDatasetSize(500, 10000);

      // 5,000,000 포인트 * 68 bytes = 340,000,000 bytes = ~340MB
      const sizeInMB = size / 1024 / 1024;
      expect(sizeInMB).toBeGreaterThan(300);
      expect(sizeInMB).toBeLessThan(400);
    });
  });
});

// 헬퍼 함수: 표준편차 계산
function calculateStd(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  return Math.sqrt(variance);
}
