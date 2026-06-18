import { expect, test } from '@playwright/test';

interface StreamingBenchmarkMetrics {
  pointsPerPoll: number;
  pollCount: number;
  completedPolls: number;
  totalPoints: number;
  operationTimes: {
    p95: number;
    p99: number;
    max: number;
  };
  frameDeltas: {
    count: number;
    p95: number;
    p99: number;
    max: number;
  };
  longTasks: {
    count: number;
    maxDuration: number;
  };
  heap?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
  };
  canvasContext: string;
}

declare global {
  interface Window {
    runStreamingBenchmark?: (options: {
      pointsPerPoll: number;
      pollCount: number;
    }) => Promise<StreamingBenchmarkMetrics>;
  }
}

const pointsPerPoll = Number(process.env.STREAM_POINTS_PER_POLL ?? 250_000);
const pollCount = Number(process.env.STREAM_POLL_COUNT ?? 3);
const enforceTarget = process.env.PERF_ENFORCE_TARGET === '1';

test('real browser streaming benchmark records 10MB/s baseline metrics', async ({
  page,
}, testInfo) => {
  await page.goto('/tests/performance/fixtures/streaming-10mb.html');

  const metrics = await page.evaluate(
    async ({ pointsPerPoll, pollCount }) => {
      if (!window.runStreamingBenchmark) {
        throw new Error('streaming benchmark fixture did not install runStreamingBenchmark');
      }
      return window.runStreamingBenchmark({ pointsPerPoll, pollCount });
    },
    { pointsPerPoll, pollCount }
  );

  await testInfo.attach('streaming-10mb-baseline.json', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  });

  console.log(JSON.stringify(metrics, null, 2));

  expect(metrics.pointsPerPoll).toBe(pointsPerPoll);
  expect(metrics.pollCount).toBe(pollCount);
  expect(metrics.completedPolls).toBe(pollCount);
  expect(metrics.totalPoints).toBe(pointsPerPoll * pollCount + 1);
  expect(metrics.canvasContext).toBe('CanvasRenderingContext2D');
  expect(metrics.frameDeltas.count).toBeGreaterThan(0);

  if (enforceTarget) {
    expect(metrics.frameDeltas.p95).toBeLessThan(16.67);
    expect(metrics.frameDeltas.p99).toBeLessThan(33);
    expect(metrics.longTasks.count).toBe(0);
  }
});
