# Streaming 10MB/s Browser Baseline

Measured on 2026-06-18 with Chromium through Playwright.

## Harness

- Command: `pnpm --filter @xelstack/chart-core test:perf`
- Browser: real Chromium canvas, not jsdom
- Load: `250_000` points per poll
- Default smoke poll count: `3`
- Target gate: opt-in with `PERF_ENFORCE_TARGET=1`

## Current Baseline

### 3 Polls

```json
{
  "pointsPerPoll": 250000,
  "pollCount": 3,
  "completedPolls": 3,
  "totalPoints": 750001,
  "operationTimes": {
    "p95": 118.70000000298023,
    "p99": 118.70000000298023,
    "max": 118.70000000298023
  },
  "frameDeltas": {
    "count": 9,
    "p95": 83.30000000000001,
    "p99": 83.30000000000001,
    "max": 83.30000000000001
  },
  "longTasks": {
    "count": 2,
    "maxDuration": 74
  },
  "heap": {
    "usedJSHeapSize": 97400000,
    "totalJSHeapSize": 148000000
  },
  "canvasContext": "CanvasRenderingContext2D"
}
```

### Target Gate Check

`PERF_ENFORCE_TARGET=1 STREAM_POLL_COUNT=1 pnpm --filter @xelstack/chart-core test:perf`
fails as expected:

- Expected p95 frame delta: `< 16.67ms`
- Current p95 frame delta: `66.6ms`
- Current long tasks: `1`

This confirms the gate catches the current architecture before Phase 1 changes.
