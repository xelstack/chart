# Realtime Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@xelstack/chart-core` viable for Datadog/APM-class realtime charts at 10MB/s input and 60fps rendering.

**Architecture:** Split the streaming hot path from the public `DataPoint[]` API. The hot path uses columnar typed-array views, monotonic x ordering, bounded sliding windows, visible-range culling, per-series downsampling, and a new incremental line renderer. `DataPoint[]` remains supported as a cold snapshot/fallback path for compatibility, docs, tooltips, and non-streaming charts.

**Tech Stack:** TypeScript 5.9.3, Canvas 2D, requestAnimationFrame, Playwright real-browser performance tests, Vitest unit tests.

---

## Current Baseline

Measured with `pnpm --filter @xelstack/chart-core test:perf`.

- Load: `250_000` points per poll, `3` polls
- Current p95 frame delta: `83.3ms`
- Current p95 operation time: `118.7ms`
- Current long tasks: `2`
- Current used JS heap: about `97.4MB`
- Goal gate: `PERF_ENFORCE_TARGET=1 STREAM_POLL_COUNT=1 pnpm --filter @xelstack/chart-core test:perf`

The target gate currently fails with p95 frame delta around `66.6ms`, which is expected before the tasks below.

## Performance Contract

The APM-grade hot path has explicit constraints:

- Streaming input is append-mostly.
- x values are numeric timestamps or `Date` values normalized to milliseconds.
- x values must be monotonically non-decreasing per series for the fastest path.
- Non-monotonic input falls back to a full rebuild path and increments a fallback counter.
- String/category x values remain supported, but they do not use the 10MB/s guarantee path.
- `windowMode: 'sliding'` is the default for realtime charts.
- `windowMode: 'accumulate'` is allowed, but it must still render only visible/downsampled data.

## File Structure

- `packages/chart-core/src/streaming/columnar-buffer.ts`: SoA ring buffer and zero-copy views.
- `packages/chart-core/src/streaming/encode-points.ts`: Converts `DataPoint[]` at ingestion boundaries.
- `packages/chart-core/src/streaming/data-buffer.ts`: Back-compatible public buffer plus columnar view accessor.
- `packages/chart-core/src/streaming/viewport-range.ts`: Binary search and monotonic range utilities.
- `packages/chart-core/src/streaming/downsample.ts`: Per-series min/max-per-pixel downsampling for columnar views.
- `packages/chart-core/src/effects/columnar-line-render.ts`: New Canvas renderer for columnar/downsampled line data.
- `packages/chart-core/src/api/incremental/incremental-renderer.ts`: Orchestrates ingest, view, cull, downsample, render, and back-pressure.
- `packages/chart-core/src/types/incremental.ts`: Streaming options, metrics, fallback counters.
- `packages/chart-core/tests/unit/streaming/*.test.ts`: Focused unit tests for each streaming unit.
- `packages/chart-core/tests/performance/streaming-10mb.bench.ts`: Real-browser smoke and target gate.
- `packages/chart-core/tests/performance/streaming-10mb-baseline.md`: Baseline and phase-by-phase results.

---

### Task 1: Extend `DataBuffer` With a Columnar Hot Path

**Files:**
- Modify: `packages/chart-core/src/streaming/types.ts`
- Modify: `packages/chart-core/src/streaming/data-buffer.ts`
- Modify: `packages/chart-core/src/streaming/index.ts`
- Test: `packages/chart-core/tests/unit/streaming/data-buffer.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test to `packages/chart-core/tests/unit/streaming/data-buffer.test.ts`:

```ts
describe('columnar hot path', () => {
  it('exposes a zero-copy columnar view after flush', () => {
    const buffer = createDataBuffer({
      initialData: [{ x: 0, y: 10, series: 'api' }],
      maxPoints: 3,
    });

    buffer.addPoints([
      { x: 1, y: 20, series: 'api' },
      { x: 2, y: 30, series: 'db' },
      { x: 3, y: 40, series: 'api' },
    ]);
    buffer.flush();

    const view = buffer.getColumnarView();
    const values = Array.from({ length: view.count }, (_, offset) => {
      const index = (view.start + offset) % view.xs.length;
      return {
        x: view.xs[index],
        y: view.ys[index],
        seriesId: view.seriesIds?.[index],
      };
    });

    expect(values).toEqual([
      { x: 1, y: 20, seriesId: 0 },
      { x: 2, y: 30, seriesId: 1 },
      { x: 3, y: 40, seriesId: 0 },
    ]);
    expect(view.seriesNames).toEqual(['api', 'db']);
  });

  it('marks non-monotonic numeric x input as fallback-required', () => {
    const buffer = createDataBuffer();

    buffer.addPoints([
      { x: 10, y: 10 },
      { x: 8, y: 20 },
    ]);
    buffer.flush();

    expect(buffer.getColumnarView().isMonotonic).toBe(false);
    expect(buffer.getState().fallbackCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/unit/streaming/data-buffer.test.ts
```

Expected: FAIL because `getColumnarView` and `fallbackCount` do not exist.

- [ ] **Step 3: Add types**

In `packages/chart-core/src/streaming/types.ts`, import `ColumnarDatasetView` and add the fields:

```ts
import type { ColumnarDatasetView } from './columnar-buffer';

export interface DataBufferState {
  readonly current: readonly DataPoint[];
  readonly pending: readonly DataPoint[];
  readonly lastRenderedIndex: number;
  readonly maxPoints: number | undefined;
  readonly totalCount: number;
  readonly fallbackCount: number;
}

export interface DataBuffer {
  getCurrent(): readonly DataPoint[];
  getPending(): readonly DataPoint[];
  getColumnarView(): ColumnarDatasetView & {
    readonly seriesNames: readonly string[];
    readonly categories?: readonly string[];
    readonly isMonotonic: boolean;
  };
  addPoints(points: readonly DataPoint[]): void;
  flush(): readonly DataPoint[];
  clear(): void;
  getTotalCount(): number;
  setMaxPoints(maxPoints: number | undefined): void;
  getState(): DataBufferState;
}
```

- [ ] **Step 4: Implement minimal columnar state in `data-buffer.ts`**

Keep `getCurrent()` as the compatibility snapshot, but maintain columnar state on `flush()`.

```ts
import { createColumnarRingBuffer } from './columnar-buffer';
import { encodePoints } from './encode-points';

let fallbackCount = 0;
let seriesNames: readonly string[] = [];
let categories: readonly string[] | undefined;
let isMonotonic = true;
let lastX: number | undefined;
let columnar = createColumnarRingBuffer({
  capacity: maxPoints ?? Math.max(options.initialData?.length ?? 1, 1),
});

function ensureColumnarCapacity(required: number): void {
  const nextCapacity = maxPoints ?? Math.max(required, columnar.capacity * 2);
  if (nextCapacity <= columnar.capacity) return;

  const previous = getCurrentSnapshot();
  columnar = createColumnarRingBuffer({ capacity: nextCapacity });
  const encoded = encodePoints(previous);
  columnar.push(encoded.xs, encoded.ys, encoded.seriesIds);
}

function updateMonotonic(xs: Float64Array): void {
  for (const x of xs) {
    if (lastX !== undefined && x < lastX) {
      isMonotonic = false;
      fallbackCount++;
    }
    lastX = x;
  }
}
```

Implement `getColumnarView()` by returning `columnar.view()` plus `seriesNames`, `categories`, and `isMonotonic`.

- [ ] **Step 5: Run the focused test**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/unit/streaming/data-buffer.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run:

```bash
pnpm --filter @xelstack/chart-core exec tsc -p tsconfig.test.json --noEmit
```

Expected: PASS.

---

### Task 2: Add Streaming Window Mode and Capacity Defaults

**Files:**
- Modify: `packages/chart-core/src/types/incremental.ts`
- Modify: `packages/chart-core/src/api/incremental/incremental-renderer.ts`
- Test: `packages/chart-core/tests/integration/incremental-rendering.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test:

```ts
it('uses sliding window mode by default and caps retained points from canvas width', () => {
  const chart = createChart(container, { points: [{ x: 0, y: 0 }] }, {
    type: 'line',
    width: 800,
    height: 600,
    responsive: false,
  });

  chart.addPointsIncremental(
    Array.from({ length: 10_000 }, (_, index) => ({
      x: index + 1,
      y: index % 100,
    })),
    { autoRender: false }
  );

  chart.resumeIncremental();

  const state = chart.getIncrementalState();
  expect(state.windowMode).toBe('sliding');
  expect(state.totalPoints).toBeLessThanOrEqual(2_000);
  chart.destroy();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/integration/incremental-rendering.test.ts
```

Expected: FAIL because `windowMode` is not in state and default capacity is undefined.

- [ ] **Step 3: Extend incremental types**

In `packages/chart-core/src/types/incremental.ts`:

```ts
export type RealtimeWindowMode = 'sliding' | 'accumulate';

export interface IncrementalRenderOptions {
  enabled?: boolean;
  frameBuffering?: boolean;
  maxPoints?: number;
  windowMode?: RealtimeWindowMode;
}

export interface IncrementalRenderState {
  readonly totalPoints: number;
  readonly pendingPoints: number;
  readonly frameCount: number;
  readonly averageFrameTime: number;
  readonly isPaused: boolean;
  readonly isActive: boolean;
  readonly isOffscreenValid: boolean;
  readonly windowMode: RealtimeWindowMode;
  readonly fallbackCount: number;
}
```

- [ ] **Step 4: Add default capacity helper**

In `incremental-renderer.ts`:

```ts
function defaultSlidingCapacity(width: number | undefined): number {
  const pixelWidth = width ?? 800;
  return Math.min(50_000, Math.max(2_000, pixelWidth * 2));
}
```

Initialize options:

```ts
let incrementalOptions: Required<Pick<
  IncrementalRenderOptions,
  'enabled' | 'frameBuffering' | 'windowMode'
>> & Pick<IncrementalRenderOptions, 'maxPoints'> = {
  enabled: true,
  frameBuffering: true,
  windowMode: 'sliding',
  maxPoints: defaultSlidingCapacity(getConfig().width),
};
```

- [ ] **Step 5: Wire option updates**

When `setIncrementalOptions()` receives `windowMode: 'accumulate'`, call `dataBuffer.setMaxPoints(undefined)`. When it receives `windowMode: 'sliding'`, set `maxPoints` to the explicit value or `defaultSlidingCapacity(getConfig().width)`.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/integration/incremental-rendering.test.ts tests/unit/streaming/data-buffer.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run perf smoke**

Run:

```bash
pnpm --filter @xelstack/chart-core test:perf
```

Expected: PASS without target enforcement. Record p95 frame delta and heap in `packages/chart-core/tests/performance/streaming-10mb-baseline.md`.

---

### Task 3: Add Monotonic Visible-Range Culling

**Files:**
- Create: `packages/chart-core/src/streaming/viewport-range.ts`
- Modify: `packages/chart-core/src/streaming/index.ts`
- Test: `packages/chart-core/tests/unit/streaming/viewport-range.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `viewport-range.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { findVisibleRange, lowerBound, upperBound } from '../../../src/streaming/viewport-range';

describe('viewport range', () => {
  it('finds lower and upper bounds in sorted typed arrays', () => {
    const xs = new Float64Array([1, 2, 3, 4, 5]);

    expect(lowerBound(xs, 0, xs.length, 2.5)).toBe(2);
    expect(upperBound(xs, 0, xs.length, 4)).toBe(4);
  });

  it('returns the visible half-open range for a contiguous columnar view', () => {
    const xs = new Float64Array([1, 2, 3, 4, 5, 6]);

    expect(findVisibleRange({ xs, start: 0, count: 6 }, 2.5, 5)).toEqual({
      startOffset: 2,
      endOffset: 5,
      count: 3,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/unit/streaming/viewport-range.test.ts
```

Expected: FAIL because `viewport-range.ts` does not exist.

- [ ] **Step 3: Implement `viewport-range.ts`**

```ts
export interface XColumnView {
  readonly xs: Float64Array;
  readonly start: number;
  readonly count: number;
}

export interface VisibleRange {
  readonly startOffset: number;
  readonly endOffset: number;
  readonly count: number;
}

export function lowerBound(
  values: Float64Array,
  from: number,
  to: number,
  target: number
): number {
  let lo = from;
  let hi = to;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (values[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function upperBound(
  values: Float64Array,
  from: number,
  to: number,
  target: number
): number {
  let lo = from;
  let hi = to;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (values[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function findVisibleRange(
  view: XColumnView,
  xMin: number,
  xMax: number
): VisibleRange {
  if (view.count === 0) {
    return { startOffset: 0, endOffset: 0, count: 0 };
  }

  if (view.start !== 0 && view.start + view.count > view.xs.length) {
    return findWrappedVisibleRange(view, xMin, xMax);
  }

  const from = view.start;
  const to = view.start + view.count;
  const startOffset = lowerBound(view.xs, from, to, xMin) - view.start;
  const endOffset = upperBound(view.xs, from, to, xMax) - view.start;

  return {
    startOffset,
    endOffset,
    count: Math.max(0, endOffset - startOffset),
  };
}

function findWrappedVisibleRange(
  view: XColumnView,
  xMin: number,
  xMax: number
): VisibleRange {
  // Sliding windows are usually contiguous after periodic rebuilds. Wrapped
  // views still need correctness; linear offset scan is the safe fallback.
  let startOffset = 0;
  while (
    startOffset < view.count &&
    view.xs[(view.start + startOffset) % view.xs.length] < xMin
  ) {
    startOffset++;
  }

  let endOffset = startOffset;
  while (
    endOffset < view.count &&
    view.xs[(view.start + endOffset) % view.xs.length] <= xMax
  ) {
    endOffset++;
  }

  return {
    startOffset,
    endOffset,
    count: Math.max(0, endOffset - startOffset),
  };
}
```

- [ ] **Step 4: Export utilities**

Add to `packages/chart-core/src/streaming/index.ts`:

```ts
export { findVisibleRange, lowerBound, upperBound } from './viewport-range';
export type { VisibleRange, XColumnView } from './viewport-range';
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/unit/streaming/viewport-range.test.ts
```

Expected: PASS.

---

### Task 4: Add Per-Series Min/Max Downsampling

**Files:**
- Create: `packages/chart-core/src/streaming/downsample.ts`
- Modify: `packages/chart-core/src/streaming/index.ts`
- Test: `packages/chart-core/tests/unit/streaming/downsample.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `downsample.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { minMaxPerPixel } from '../../../src/streaming/downsample';

describe('minMaxPerPixel', () => {
  it('keeps both min and max y values per pixel bucket', () => {
    const result = minMaxPerPixel({
      xs: new Float64Array([0, 1, 2, 3]),
      ys: new Float64Array([10, 100, 20, 80]),
      startOffset: 0,
      count: 4,
      xMin: 0,
      xMax: 3,
      pixelWidth: 2,
    });

    expect(Array.from(result.xs)).toEqual([0, 1, 2, 3]);
    expect(Array.from(result.ys)).toEqual([10, 100, 20, 80]);
  });

  it('preserves independent series buckets', () => {
    const result = minMaxPerPixel({
      xs: new Float64Array([0, 0, 1, 1]),
      ys: new Float64Array([10, 100, 20, 80]),
      seriesIds: new Uint16Array([0, 1, 0, 1]),
      startOffset: 0,
      count: 4,
      xMin: 0,
      xMax: 1,
      pixelWidth: 1,
    });

    expect(Array.from(result.seriesIds)).toEqual([0, 0, 1, 1]);
    expect(Array.from(result.ys)).toEqual([10, 20, 100, 80]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/unit/streaming/downsample.test.ts
```

Expected: FAIL because `downsample.ts` does not exist.

- [ ] **Step 3: Implement `minMaxPerPixel`**

Implement a single-pass bucket accumulator. The result type is:

```ts
export interface DownsampleInput {
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly seriesIds?: Uint16Array;
  readonly startOffset: number;
  readonly count: number;
  readonly xMin: number;
  readonly xMax: number;
  readonly pixelWidth: number;
}

export interface DownsampledSeriesView {
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly seriesIds: Uint16Array;
  readonly count: number;
}
```

The algorithm:

```ts
export function minMaxPerPixel(input: DownsampleInput): DownsampledSeriesView {
  const width = Math.max(1, Math.floor(input.pixelWidth));
  const bucketCount = width;
  const bucketByKey = new Map<string, {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    seriesId: number;
  }>();

  const span = Math.max(1, input.xMax - input.xMin);
  for (let offset = 0; offset < input.count; offset++) {
    const sourceIndex = input.startOffset + offset;
    const x = input.xs[sourceIndex];
    const y = input.ys[sourceIndex];
    const seriesId = input.seriesIds?.[sourceIndex] ?? 0;
    const bucket = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor(((x - input.xMin) / span) * bucketCount))
    );
    const key = `${seriesId}:${bucket}`;
    const current = bucketByKey.get(key);

    if (!current) {
      bucketByKey.set(key, { minX: x, minY: y, maxX: x, maxY: y, seriesId });
    } else {
      if (y < current.minY) {
        current.minY = y;
        current.minX = x;
      }
      if (y > current.maxY) {
        current.maxY = y;
        current.maxX = x;
      }
    }
  }

  const points: Array<{ x: number; y: number; seriesId: number }> = [];
  for (const bucket of bucketByKey.values()) {
    points.push({ x: bucket.minX, y: bucket.minY, seriesId: bucket.seriesId });
    if (bucket.maxX !== bucket.minX || bucket.maxY !== bucket.minY) {
      points.push({ x: bucket.maxX, y: bucket.maxY, seriesId: bucket.seriesId });
    }
  }

  points.sort((a, b) => a.seriesId - b.seriesId || a.x - b.x);

  const xs = new Float64Array(points.length);
  const ys = new Float64Array(points.length);
  const seriesIds = new Uint16Array(points.length);
  for (let index = 0; index < points.length; index++) {
    xs[index] = points[index].x;
    ys[index] = points[index].y;
    seriesIds[index] = points[index].seriesId;
  }

  return { xs, ys, seriesIds, count: points.length };
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/unit/streaming/downsample.test.ts
```

Expected: PASS.

---

### Task 5: Add Columnar Line Renderer

**Files:**
- Create: `packages/chart-core/src/effects/columnar-line-render.ts`
- Modify: `packages/chart-core/src/effects/index.ts`
- Test: `packages/chart-core/tests/unit/effects/columnar-line-render.test.ts`

- [ ] **Step 1: Write the failing renderer test**

Create `columnar-line-render.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { renderColumnarLine } from '../../../src/effects/columnar-line-render';

function createMockContext() {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    strokeStyle: '',
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

describe('renderColumnarLine', () => {
  it('renders one continuous path per series from columnar arrays', () => {
    const ctx = createMockContext();

    renderColumnarLine(ctx, {
      xs: new Float64Array([0, 1, 0, 1]),
      ys: new Float64Array([10, 20, 30, 40]),
      seriesIds: new Uint16Array([0, 0, 1, 1]),
      count: 4,
      viewport: { xMin: 0, xMax: 1, yMin: 0, yMax: 100 },
      width: 100,
      height: 100,
      colors: ['red', 'blue'],
    });

    expect(ctx.beginPath).toHaveBeenCalledTimes(2);
    expect(ctx.moveTo).toHaveBeenCalledTimes(2);
    expect(ctx.lineTo).toHaveBeenCalledTimes(2);
    expect(ctx.stroke).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/unit/effects/columnar-line-render.test.ts
```

Expected: FAIL because `columnar-line-render.ts` does not exist.

- [ ] **Step 3: Implement renderer**

Create `packages/chart-core/src/effects/columnar-line-render.ts`:

```ts
import type { Viewport } from '@chart/types/index';

export interface ColumnarLineRenderInput {
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly seriesIds: Uint16Array;
  readonly count: number;
  readonly viewport: Viewport;
  readonly width: number;
  readonly height: number;
  readonly colors: readonly string[];
}

export function renderColumnarLine(
  ctx: CanvasRenderingContext2D,
  input: ColumnarLineRenderInput
): void {
  const { viewport, width, height } = input;
  const xSpan = viewport.xMax - viewport.xMin || 1;
  const ySpan = viewport.yMax - viewport.yMin || 1;
  let activeSeries = -1;
  let hasPoint = false;

  ctx.save();

  for (let index = 0; index < input.count; index++) {
    const seriesId = input.seriesIds[index] ?? 0;
    if (seriesId !== activeSeries) {
      if (hasPoint) ctx.stroke();
      activeSeries = seriesId;
      hasPoint = false;
      ctx.beginPath();
      ctx.strokeStyle = input.colors[seriesId % input.colors.length] ?? '#3366ff';
      ctx.lineWidth = 2;
    }

    const px = ((input.xs[index] - viewport.xMin) / xSpan) * width;
    const py = height - ((input.ys[index] - viewport.yMin) / ySpan) * height;

    if (!hasPoint) {
      ctx.moveTo(px, py);
      hasPoint = true;
    } else {
      ctx.lineTo(px, py);
    }
  }

  if (hasPoint) ctx.stroke();
  ctx.restore();
}
```

- [ ] **Step 4: Export renderer**

In `packages/chart-core/src/effects/index.ts`:

```ts
export { renderColumnarLine } from './columnar-line-render';
export type { ColumnarLineRenderInput } from './columnar-line-render';
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/unit/effects/columnar-line-render.test.ts
```

Expected: PASS.

---

### Task 6: Wire Incremental Renderer to Columnar Cull/Downsample/Render

**Files:**
- Modify: `packages/chart-core/src/api/incremental/incremental-renderer.ts`
- Modify: `packages/chart-core/src/api/incremental/index.ts`
- Test: `packages/chart-core/tests/integration/incremental-rendering.test.ts`
- Test: `packages/chart-core/tests/performance/streaming-10mb.bench.ts`

- [ ] **Step 1: Write the failing integration test**

Add:

```ts
it('incremental append uses columnar metrics without rebuilding DataPoint arrays per frame', () => {
  const chart = createChart(container, { points: [{ x: 0, y: 0 }] }, {
    type: 'line',
    width: 800,
    height: 600,
    responsive: false,
  });

  chart.addPointsIncremental(
    Array.from({ length: 5000 }, (_, index) => ({
      x: index + 1,
      y: index % 100,
      series: index % 2 === 0 ? 'api' : 'db',
    }))
  );

  const state = chart.getIncrementalState();
  expect(state.renderPath).toBe('columnar');
  expect(state.downsampledPoints).toBeLessThanOrEqual(3200);
  expect(state.fallbackCount).toBe(0);
  chart.destroy();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/integration/incremental-rendering.test.ts
```

Expected: FAIL because `renderPath` and `downsampledPoints` are not exposed.

- [ ] **Step 3: Extend state type**

In `types/incremental.ts`:

```ts
export type IncrementalRenderPath = 'columnar' | 'fallback';

export interface IncrementalRenderState {
  readonly totalPoints: number;
  readonly pendingPoints: number;
  readonly frameCount: number;
  readonly averageFrameTime: number;
  readonly isPaused: boolean;
  readonly isActive: boolean;
  readonly isOffscreenValid: boolean;
  readonly windowMode: RealtimeWindowMode;
  readonly fallbackCount: number;
  readonly renderPath: IncrementalRenderPath;
  readonly downsampledPoints: number;
}
```

- [ ] **Step 4: Replace the append render path**

In `incremental-renderer.ts`, append rendering should:

1. `dataBuffer.flush()`
2. `const view = dataBuffer.getColumnarView()`
3. If `view.isMonotonic` is false, use the existing full `render()` fallback and set `renderPath = 'fallback'`
4. Calculate the visible range with `findVisibleRange`
5. Downsample with `minMaxPerPixel`
6. Clear and render with `renderColumnarLine`
7. Blit offscreen canvas to main canvas

The replacement structure:

```ts
const renderColumnarFrame = (): void => {
  const cfg = getConfig();
  const viewport = context.getViewport();
  const view = dataBuffer.getColumnarView();

  if (!view.isMonotonic || cfg.type !== 'line') {
    lastRenderPath = 'fallback';
    render();
    return;
  }

  const visible = findVisibleRange(view, viewport.xMin, viewport.xMax);
  const downsampled = minMaxPerPixel({
    xs: view.xs,
    ys: view.ys,
    seriesIds: view.seriesIds,
    startOffset: visible.startOffset,
    count: visible.count,
    xMin: viewport.xMin,
    xMax: viewport.xMax,
    pixelWidth: cfg.width ?? 800,
  });

  lastRenderPath = 'columnar';
  lastDownsampledPoints = downsampled.count;

  if (!offscreen.ctx || !offscreen.canvas) return;
  offscreen.ctx.clearRect(0, 0, cfg.width ?? 800, cfg.height ?? 600);
  renderColumnarLine(offscreen.ctx, {
    xs: downsampled.xs,
    ys: downsampled.ys,
    seriesIds: downsampled.seriesIds,
    count: downsampled.count,
    viewport,
    width: cfg.width ?? 800,
    height: cfg.height ?? 600,
    colors: cfg.colors ?? ['#3366ff'],
  });
  mainCtx.clearRect(0, 0, cfg.width ?? 800, cfg.height ?? 600);
  mainCtx.drawImage(offscreen.canvas, 0, 0);
  offscreen.validate();
};
```

- [ ] **Step 5: Preserve fallback compatibility**

Keep existing `setDataset({ ...getDataset(), points: [...] })` only in fallback paths:

- non-line charts
- non-monotonic input
- replace/prepend deltas
- explicit `updateData()`

Append-only monotonic line streams must not rebuild full `Dataset.points` per frame.

- [ ] **Step 6: Run integration tests**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/integration/incremental-rendering.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run perf smoke**

Run:

```bash
pnpm --filter @xelstack/chart-core test:perf
```

Expected: PASS. Record metrics in `streaming-10mb-baseline.md`.

---

### Task 7: Add Back-Pressure and Append Fast Path

**Files:**
- Modify: `packages/chart-core/src/streaming/render-queue.ts`
- Modify: `packages/chart-core/src/streaming/delta-calculator.ts`
- Modify: `packages/chart-core/src/api/incremental/incremental-renderer.ts`
- Test: `packages/chart-core/tests/unit/streaming/render-queue.test.ts`
- Test: `packages/chart-core/tests/unit/streaming/delta-calculator.test.ts`

- [ ] **Step 1: Write failing back-pressure test**

Add to `render-queue.test.ts`:

```ts
it('drops oldest queued points when maxSize is exceeded', () => {
  const queue = createRenderQueue({ maxSize: 3 });

  queue.enqueue([{ x: 1, y: 1 }, { x: 2, y: 2 }]);
  queue.enqueue([{ x: 3, y: 3 }, { x: 4, y: 4 }]);

  expect(queue.dequeueAll()).toEqual([
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
  ]);
  expect(queue.getState().droppedCount).toBe(1);
});
```

- [ ] **Step 2: Write failing append fast-path test**

Add to `delta-calculator.test.ts`:

```ts
it('uses append fast path when skipPrependCheck is true', () => {
  const current = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
  const next = [...current, { x: 3, y: 3 }];

  expect(calculateDelta(current, next, { skipPrependCheck: true })).toEqual({
    type: 'append',
    newPoints: [{ x: 3, y: 3 }],
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/unit/streaming/render-queue.test.ts tests/unit/streaming/delta-calculator.test.ts
```

Expected: FAIL if current queue/delta behavior is incomplete.

- [ ] **Step 4: Implement queue cap**

In `render-queue.ts`, enforce `maxSize` by trimming from the front and incrementing `droppedCount`.

- [ ] **Step 5: Implement delta append fast path**

In `delta-calculator.ts`, before prepend/replace checks:

```ts
if (options?.skipPrependCheck === true && next.length >= current.length) {
  let prefixMatches = true;
  for (let index = Math.max(0, current.length - 1); index < current.length; index++) {
    if (current[index] !== next[index]) {
      prefixMatches = false;
      break;
    }
  }
  if (prefixMatches) {
    return {
      type: next.length === current.length ? 'none' : 'append',
      newPoints: next.slice(current.length),
    };
  }
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
pnpm --filter @xelstack/chart-core exec vitest run tests/unit/streaming/render-queue.test.ts tests/unit/streaming/delta-calculator.test.ts
```

Expected: PASS.

---

### Task 8: Turn on Performance Gates in Stages

**Files:**
- Modify: `packages/chart-core/tests/performance/streaming-10mb.bench.ts`
- Modify: `packages/chart-core/tests/performance/streaming-10mb-baseline.md`
- Modify: `packages/chart-core/package.json`

- [ ] **Step 1: Add profile-based thresholds**

In `streaming-10mb.bench.ts`:

```ts
const profile = process.env.STREAM_PERF_PROFILE ?? 'smoke';
const thresholds = profile === 'target'
  ? { p95: 16.67, p99: 33, longTasks: 0 }
  : { p95: 50, p99: 80, longTasks: 2 };
```

- [ ] **Step 2: Apply thresholds when enforcement is enabled**

```ts
if (enforceTarget) {
  expect(metrics.frameDeltas.p95).toBeLessThan(thresholds.p95);
  expect(metrics.frameDeltas.p99).toBeLessThan(thresholds.p99);
  expect(metrics.longTasks.count).toBeLessThanOrEqual(thresholds.longTasks);
}
```

- [ ] **Step 3: Add scripts**

In `packages/chart-core/package.json`:

```json
{
  "scripts": {
    "test:perf": "playwright test -c playwright.perf.config.ts",
    "test:perf:target": "PERF_ENFORCE_TARGET=1 STREAM_PERF_PROFILE=target playwright test -c playwright.perf.config.ts"
  }
}
```

- [ ] **Step 4: Run smoke**

Run:

```bash
pnpm --filter @xelstack/chart-core test:perf
```

Expected: PASS.

- [ ] **Step 5: Run target**

Run:

```bash
pnpm --filter @xelstack/chart-core test:perf:target
```

Expected after Tasks 1-7: PASS. If it fails, do not proceed to Worker. Inspect metrics and identify whether the remaining bottleneck is rendering, long task, heap, or data generation.

---

### Task 9: Add Worker/OffscreenCanvas Only if Main-Thread Gates Still Fail

**Files:**
- Create: `packages/chart-core/src/api/incremental/render-worker.ts`
- Modify: `packages/chart-core/src/api/incremental/offscreen-canvas.ts`
- Modify: `packages/chart-core/src/api/incremental/incremental-renderer.ts`
- Modify: `packages/chart-core/rollup.config.js`
- Test: `packages/chart-core/tests/performance/streaming-10mb.bench.ts`

- [ ] **Step 1: Check trigger condition**

Run:

```bash
pnpm --filter @xelstack/chart-core test:perf:target
```

Only start this task if one of these remains true:

- p95 frame delta is above `16.67ms`
- p99 frame delta is above `33ms`
- long task count is above `0`

- [ ] **Step 2: Implement Worker boundary**

Move encode/cull/downsample into `render-worker.ts`. Transfer `ArrayBuffer`s with a double-buffering ownership model:

```ts
export interface WorkerIngestMessage {
  readonly type: 'ingest';
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly seriesIds: Uint16Array;
}

export interface WorkerFrameMessage {
  readonly type: 'frame';
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly seriesIds: Uint16Array;
  readonly count: number;
}
```

- [ ] **Step 3: Add feature detection**

Use Worker path only when all are true:

```ts
const supportsWorkerCanvas =
  typeof Worker !== 'undefined' &&
  typeof OffscreenCanvas !== 'undefined' &&
  typeof HTMLCanvasElement !== 'undefined' &&
  'transferControlToOffscreen' in HTMLCanvasElement.prototype;
```

- [ ] **Step 4: Preserve fallback**

If feature detection fails, stay on the main-thread columnar path. Do not throw.

- [ ] **Step 5: Run target gate**

Run:

```bash
pnpm --filter @xelstack/chart-core test:perf:target
```

Expected: PASS with long task count `0`.

---

## Final Verification

Run:

```bash
pnpm --filter @xelstack/chart-core exec tsc -p tsconfig.test.json --noEmit
pnpm --filter @xelstack/chart-core exec vitest run tests/unit/streaming tests/unit/effects/columnar-line-render.test.ts tests/integration/incremental-rendering.test.ts
pnpm --filter @xelstack/chart-core test:perf
pnpm --filter @xelstack/chart-core test:perf:target
pnpm --filter @xelstack/chart-core build
```

Expected:

- Typecheck passes.
- Focused unit/integration tests pass.
- Smoke perf passes.
- Target perf passes.
- Build passes.

If full `pnpm --filter @xelstack/chart-core test` is run and `tests/performance/fp-performance.test.ts` flakes on pipe overhead, record it separately. Do not hide a streaming regression behind that existing unrelated perf flake.

## Completion Criteria

The realtime performance track is complete when:

- `PERF_ENFORCE_TARGET=1 STREAM_PERF_PROFILE=target pnpm --filter @xelstack/chart-core test:perf` passes.
- `renderPath` is `columnar` for monotonic line streams.
- fallback count is `0` for the benchmark fixture.
- p95 frame delta is below `16.67ms`.
- p99 frame delta is below `33ms`.
- long task count is `0`.
- heap does not grow with poll count in `sliding` mode.
- public `ChartHandle` behavior remains backward compatible.
