/**
 * DataPoint to columnar encoding for streaming ingestion boundaries.
 * @module streaming/encode-points
 */

import type { DataPoint } from '@chart/types/index';

export interface EncodedPoints {
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly seriesIds: Uint16Array;
  readonly seriesNames: readonly string[];
  readonly categories?: readonly string[];
}

export function encodePoints(points: readonly DataPoint[]): EncodedPoints {
  const xs = new Float64Array(points.length);
  const ys = new Float64Array(points.length);
  const seriesIds = new Uint16Array(points.length);
  const seriesNames: string[] = [];
  const seriesMap = new Map<string, number>();
  const categories: string[] = [];
  const categoryMap = new Map<string, number>();

  let hasCategories = false;

  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    xs[index] = encodeX(point.x, categoryMap, categories);
    ys[index] = point.y;

    if (typeof point.x === 'string') {
      hasCategories = true;
    }

    if (point.series !== undefined) {
      let seriesId = seriesMap.get(point.series);
      if (seriesId === undefined) {
        seriesId = seriesNames.length;
        if (seriesId > 0xffff) {
          throw new RangeError('encodePoints supports at most 65536 series');
        }
        seriesMap.set(point.series, seriesId);
        seriesNames.push(point.series);
      }
      seriesIds[index] = seriesId;
    }
  }

  return {
    xs,
    ys,
    seriesIds,
    seriesNames,
    categories: hasCategories ? categories : undefined,
  };
}

function encodeX(
  x: DataPoint['x'],
  categoryMap: Map<string, number>,
  categories: string[]
): number {
  if (typeof x === 'number') return x;
  if (x instanceof Date) return x.getTime();

  let categoryId = categoryMap.get(x);
  if (categoryId === undefined) {
    categoryId = categories.length;
    categoryMap.set(x, categoryId);
    categories.push(x);
  }
  return categoryId;
}
