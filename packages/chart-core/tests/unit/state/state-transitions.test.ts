import { describe, it, expect } from 'vitest';
import {
  transitionToInitializing,
  transitionToReady,
  transitionToRendering,
  transitionToUpdating,
  transitionToError,
  completeRender,
} from '../../../src/state/state-transitions';
import {
  createChartState,
  setError,
} from '../../../src/state/chart-state';

describe('state transitions', () => {
  it('creates initializing state from point count', () => {
    const state = transitionToInitializing(12);

    expect(state.status).toBe('initializing');
    expect(state.pointCount).toBe(12);
    expect(state.error).toBeUndefined();
  });

  it('transitions to ready and clears error', () => {
    const errored = setError(createChartState('error', 5), 'oops');

    const ready = transitionToReady(errored);

    expect(ready.status).toBe('ready');
    expect(ready.error).toBeUndefined();
    expect(ready).not.toBe(errored);
  });

  it('transitions to rendering and clears previous error', () => {
    const errored = setError(createChartState('error', 8), 'boom');

    const rendering = transitionToRendering(errored);

    expect(rendering.status).toBe('rendering');
    expect(rendering.error).toBeUndefined();
  });

  it('transitions to updating and optionally updates point count', () => {
    const initial = createChartState('ready', 4);

    const updating = transitionToUpdating(initial, 10);

    expect(updating.status).toBe('updating');
    expect(updating.pointCount).toBe(10);

    const updatingWithoutCount = transitionToUpdating(initial);
    expect(updatingWithoutCount.pointCount).toBe(4);
  });

  it('transitions to error with message', () => {
    const ready = createChartState('ready', 3);

    const errored = transitionToError(ready, 'render failed');

    expect(errored.status).toBe('error');
    expect(errored.error).toBe('render failed');
    expect(ready.status).toBe('ready');
    expect(ready.error).toBeUndefined();
  });

  it('completes render, sets last render time, and transitions to ready', () => {
    const rendering = createChartState('rendering', 5);

    const completed = completeRender(rendering, 42);

    expect(completed.status).toBe('ready');
    expect(completed.lastRenderTime).toBe(42);
    expect(completed.error).toBeUndefined();
  });
});
