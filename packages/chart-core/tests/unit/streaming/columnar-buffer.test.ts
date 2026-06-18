import { describe, expect, it } from 'vitest';
import { createColumnarRingBuffer } from '../../../src/streaming/columnar-buffer';
import { encodePoints } from '../../../src/streaming/encode-points';

function readView(view: {
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly seriesIds?: Uint16Array;
  readonly start: number;
  readonly count: number;
}) {
  const xs: number[] = [];
  const ys: number[] = [];
  const seriesIds: number[] = [];

  for (let offset = 0; offset < view.count; offset++) {
    const index = (view.start + offset) % view.xs.length;
    xs.push(view.xs[index]);
    ys.push(view.ys[index]);
    if (view.seriesIds) seriesIds.push(view.seriesIds[index]);
  }

  return { xs, ys, seriesIds };
}

describe('ColumnarRingBuffer', () => {
  it('stores numeric x/y values in insertion order without decoding DataPoint objects', () => {
    const buffer = createColumnarRingBuffer({ capacity: 5 });

    buffer.push(new Float64Array([1, 2]), new Float64Array([10, 20]));
    buffer.push(new Float64Array([3]), new Float64Array([30]));

    expect(buffer.size()).toBe(3);
    expect(readView(buffer.view())).toEqual({
      xs: [1, 2, 3],
      ys: [10, 20, 30],
      seriesIds: [],
    });
  });

  it('drops oldest values when capacity is exceeded', () => {
    const buffer = createColumnarRingBuffer({ capacity: 3 });

    buffer.push(new Float64Array([1, 2, 3]), new Float64Array([10, 20, 30]));
    buffer.push(new Float64Array([4, 5]), new Float64Array([40, 50]));

    expect(buffer.size()).toBe(3);
    expect(readView(buffer.view())).toEqual({
      xs: [3, 4, 5],
      ys: [30, 40, 50],
      seriesIds: [],
    });
  });

  it('keeps encoded series ids aligned with x/y columns', () => {
    const buffer = createColumnarRingBuffer({ capacity: 4 });

    buffer.push(
      new Float64Array([1, 2, 3, 4]),
      new Float64Array([10, 20, 30, 40]),
      new Uint16Array([0, 1, 0, 1])
    );

    expect(readView(buffer.view())).toEqual({
      xs: [1, 2, 3, 4],
      ys: [10, 20, 30, 40],
      seriesIds: [0, 1, 0, 1],
    });
  });
});

describe('encodePoints', () => {
  it('normalizes DataPoint objects into columnar arrays and dictionary-encoded series', () => {
    const encoded = encodePoints([
      { x: 1, y: 10, series: 'cpu' },
      { x: new Date(2), y: 20, series: 'mem' },
      { x: 3, y: 30, series: 'cpu' },
    ]);

    expect(Array.from(encoded.xs)).toEqual([1, 2, 3]);
    expect(Array.from(encoded.ys)).toEqual([10, 20, 30]);
    expect(Array.from(encoded.seriesIds)).toEqual([0, 1, 0]);
    expect(encoded.seriesNames).toEqual(['cpu', 'mem']);
  });

  it('uses a stable category dictionary for string x values', () => {
    const encoded = encodePoints([
      { x: 'jan', y: 10 },
      { x: 'feb', y: 20 },
      { x: 'jan', y: 30 },
    ]);

    expect(Array.from(encoded.xs)).toEqual([0, 1, 0]);
    expect(encoded.categories).toEqual(['jan', 'feb']);
  });
});
