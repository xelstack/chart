import { describe, it, expect } from 'vitest';
import {
  createChartState,
  setStatus,
  setPointCount,
  setLastRenderTime,
  setError,
  clearError,
} from '../../../src/state/chart-state';

import type { ChartState } from '../../../src/types/index';

const expectImmutableChange = (original: ChartState, updated: ChartState) => {
  expect(updated).not.toBe(original);
};

describe('chart-state utilities', () => {
  it('creates chart state with given status and point count', () => {
    const state = createChartState('initializing', 5);

    expect(state).toEqual({ status: 'initializing', pointCount: 5 });
  });

  it('setStatus returns new state and clears error when leaving error status', () => {
    const start = createChartState('error', 10, { error: 'boom' });

    const next = setStatus(start, 'ready');

    expect(next.status).toBe('ready');
    expect(next.error).toBeUndefined();
    expectImmutableChange(start, next);
    expect(start.status).toBe('error');
    expect(start.error).toBe('boom');
  });

  it('setStatus retains error when status remains error', () => {
    const start = createChartState('error', 10, { error: 'boom' });

    const next = setStatus(start, 'error');

    expect(next.error).toBe('boom');
    expectImmutableChange(start, next);
  });

  it('setPointCount updates point count immutably', () => {
    const start = createChartState('ready', 5);

    const next = setPointCount(start, 20);

    expect(next.pointCount).toBe(20);
    expect(start.pointCount).toBe(5);
    expectImmutableChange(start, next);
  });

  it('setLastRenderTime updates timestamp immutably', () => {
    const start = createChartState('ready', 5);

    const next = setLastRenderTime(start, 16);

    expect(next.lastRenderTime).toBe(16);
    expect(start.lastRenderTime).toBeUndefined();
    expectImmutableChange(start, next);
  });

  it('setError sets error message without mutating original', () => {
    const start = createChartState('ready', 5);

    const next = setError(start, 'oops');

    expect(next.error).toBe('oops');
    expect(start.error).toBeUndefined();
    expectImmutableChange(start, next);
  });

  it('clearError removes error message immutably', () => {
    const errored = setError(createChartState('error', 5), 'oops');

    const cleared = clearError(errored);

    expect(cleared.error).toBeUndefined();
    expect(errored.error).toBe('oops');
    expectImmutableChange(errored, cleared);
  });
});
