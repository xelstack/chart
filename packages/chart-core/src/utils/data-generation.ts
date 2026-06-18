/**
 * 대용량 데이터 생성 유틸리티
 * 대규모 multi-series 데이터셋을 효율적으로 생성합니다.
 * @module utils/data-generation
 */

import type { DataPoint, Dataset } from '@chart/types/index';

/**
 * 대용량 multi-series 데이터셋 생성 옵션
 */
export interface LargeDatasetOptions {
  /** 시리즈 수 (기본값: 500) */
  seriesCount?: number;
  /** 시리즈당 포인트 수 (기본값: 10000) */
  pointsPerSeries?: number;
  /** 데이터 생성 패턴 (기본값: 'sine') */
  pattern?: 'sine' | 'random' | 'linear' | 'exponential';
  /** 노이즈 레벨 (기본값: 10) */
  noiseLevel?: number;
  /** 시리즈 이름 접두사 (기본값: 'Series') */
  seriesPrefix?: string;
}

/**
 * 시리즈 생성기 함수 타입
 */
export type SeriesGenerator = (
  seriesIndex: number,
  pointIndex: number
) => number;

/**
 * 대용량 multi-series 데이터셋 생성
 * 메모리 효율적으로 대규모 데이터를 생성합니다.
 *
 * @param options - 생성 옵션
 * @returns 생성된 데이터셋
 *
 * @example
 * ```typescript
 * // 500개 시리즈, 각 10,000 포인트 (총 5백만 포인트)
 * const dataset = generateLargeMultiSeriesDataset({
 *   seriesCount: 500,
 *   pointsPerSeries: 10000,
 *   pattern: 'sine'
 * });
 * ```
 */
export function generateLargeMultiSeriesDataset(
  options: LargeDatasetOptions = {}
): Dataset {
  const {
    seriesCount = 500,
    pointsPerSeries = 10000,
    pattern = 'sine',
    noiseLevel = 10,
    seriesPrefix = 'Series',
  } = options;

  const points: DataPoint[] = [];
  const generator = createSeriesGenerator(pattern, noiseLevel);

  // 시리즈별로 포인트 생성
  for (let seriesIdx = 0; seriesIdx < seriesCount; seriesIdx++) {
    const seriesName = `${seriesPrefix} ${seriesIdx + 1}`;

    for (let pointIdx = 0; pointIdx < pointsPerSeries; pointIdx++) {
      const y = generator(seriesIdx, pointIdx);

      points.push({
        x: pointIdx,
        y,
        series: seriesName,
      });
    }
  }

  return { points };
}

/**
 * 시리즈별 데이터 스트림 생성기 생성
 * 다양한 패턴으로 데이터를 생성하는 함수를 반환합니다.
 *
 * @param pattern - 생성 패턴
 * @param noiseLevel - 노이즈 레벨
 * @returns 시리즈 생성기 함수
 *
 * @example
 * ```typescript
 * const generator = createSeriesGenerator('sine', 10);
 * const value = generator(0, 100); // 시리즈 0, 포인트 100의 값
 * ```
 */
export function createSeriesGenerator(
  pattern: 'sine' | 'random' | 'linear' | 'exponential',
  noiseLevel: number
): SeriesGenerator {
  switch (pattern) {
    case 'sine':
      return (seriesIdx: number, pointIdx: number) => {
        const baseValue = Math.sin(pointIdx / 100 + seriesIdx / 50) * 50;
        const noise = (Math.random() - 0.5) * noiseLevel;
        return baseValue + noise;
      };

    case 'random':
      return (_seriesIdx: number, _pointIdx: number) => {
        return Math.random() * 100;
      };

    case 'linear':
      return (seriesIdx: number, pointIdx: number) => {
        const slope = 0.1 + seriesIdx * 0.01;
        const baseValue = pointIdx * slope;
        const noise = (Math.random() - 0.5) * noiseLevel;
        return baseValue + noise;
      };

    case 'exponential':
      return (seriesIdx: number, pointIdx: number) => {
        const rate = 0.001 + seriesIdx * 0.0001;
        const baseValue = Math.exp(pointIdx * rate);
        const noise = (Math.random() - 0.5) * noiseLevel;
        return baseValue + noise;
      };

    default:
      return () => 0;
  }
}

/**
 * 실시간 데이터 포인트 생성
 * 기존 데이터셋에 추가할 새로운 포인트를 생성합니다.
 *
 * @param currentTime - 현재 시간 (x 값)
 * @param seriesCount - 시리즈 수
 * @param generator - 시리즈 생성기
 * @returns 생성된 포인트 배열
 *
 * @example
 * ```typescript
 * const generator = createSeriesGenerator('sine', 10);
 * const newPoints = generateRealtimePoints(10000, 500, generator);
 * // 500개 시리즈에 대한 새로운 포인트 생성
 * ```
 */
export function generateRealtimePoints(
  currentTime: number,
  seriesCount: number,
  generator: SeriesGenerator,
  seriesPrefix = 'Series'
): DataPoint[] {
  const points: DataPoint[] = [];

  for (let seriesIdx = 0; seriesIdx < seriesCount; seriesIdx++) {
    const seriesName = `${seriesPrefix} ${seriesIdx + 1}`;
    const y = generator(seriesIdx, currentTime);

    points.push({
      x: currentTime,
      y,
      series: seriesName,
    });
  }

  return points;
}

/**
 * 데이터셋 크기 추정 (바이트)
 * 생성될 데이터셋의 대략적인 메모리 사용량을 계산합니다.
 *
 * @param seriesCount - 시리즈 수
 * @param pointsPerSeries - 시리즈당 포인트 수
 * @returns 예상 메모리 사용량 (바이트)
 *
 * @example
 * ```typescript
 * const size = estimateDatasetSize(500, 10000);
 * console.log(`Estimated size: ${(size / 1024 / 1024).toFixed(2)} MB`);
 * ```
 */
export function estimateDatasetSize(
  seriesCount: number,
  pointsPerSeries: number
): number {
  const totalPoints = seriesCount * pointsPerSeries;

  // DataPoint 구조 크기 추정:
  // - x: number (8 bytes)
  // - y: number (8 bytes)
  // - series: string (~20 bytes for "Series 123")
  // - 객체 오버헤드 (~32 bytes)
  // 총 약 68 bytes per point

  const bytesPerPoint = 68;
  return totalPoints * bytesPerPoint;
}
