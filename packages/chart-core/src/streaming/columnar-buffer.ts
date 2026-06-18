/**
 * Columnar ring buffer for streaming hot paths.
 * Keeps x/y/series data in typed arrays so render code can avoid DataPoint[] churn.
 * @module streaming/columnar-buffer
 */

export interface ColumnarDatasetView {
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly seriesIds?: Uint16Array;
  readonly start: number;
  readonly count: number;
}

export interface ColumnarRingBuffer {
  readonly capacity: number;
  push(xs: Float64Array, ys: Float64Array, seriesIds?: Uint16Array): void;
  size(): number;
  view(): ColumnarDatasetView;
  clear(): void;
}

export interface CreateColumnarRingBufferOptions {
  readonly capacity: number;
}

export function createColumnarRingBuffer(
  options: CreateColumnarRingBufferOptions
): ColumnarRingBuffer {
  const { capacity } = options;
  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new RangeError('ColumnarRingBuffer capacity must be a positive integer');
  }

  const xs = new Float64Array(capacity);
  const ys = new Float64Array(capacity);
  let seriesIds: Uint16Array | undefined;
  let start = 0;
  let count = 0;

  const ensureSeriesIds = (): Uint16Array => {
    if (!seriesIds) {
      seriesIds = new Uint16Array(capacity);
    }
    return seriesIds;
  };

  return {
    capacity,

    push(nextXs, nextYs, nextSeriesIds): void {
      if (nextXs.length !== nextYs.length) {
        throw new RangeError('ColumnarRingBuffer x/y column lengths must match');
      }
      if (nextSeriesIds && nextSeriesIds.length !== nextXs.length) {
        throw new RangeError('ColumnarRingBuffer series column length must match x/y');
      }

      const targetSeriesIds = nextSeriesIds ? ensureSeriesIds() : seriesIds;

      for (let offset = 0; offset < nextXs.length; offset++) {
        let writeIndex: number;
        if (count < capacity) {
          writeIndex = (start + count) % capacity;
          count++;
        } else {
          writeIndex = start;
          start = (start + 1) % capacity;
        }

        xs[writeIndex] = nextXs[offset];
        ys[writeIndex] = nextYs[offset];
        if (targetSeriesIds) {
          targetSeriesIds[writeIndex] = nextSeriesIds?.[offset] ?? 0;
        }
      }
    },

    size(): number {
      return count;
    },

    view(): ColumnarDatasetView {
      return {
        xs,
        ys,
        seriesIds,
        start,
        count,
      };
    },

    clear(): void {
      start = 0;
      count = 0;
    },
  };
}
