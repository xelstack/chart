# Realtime Chart API Documentation

This document describes the realtime data streaming capabilities of the chart library.

## Overview

The realtime API enables dynamic data updates without recreating the entire chart. It's designed for:

- **Live monitoring dashboards**: Server metrics, network traffic, sensor data
- **Financial charts**: Stock prices, cryptocurrency, market data
- **IoT applications**: Temperature sensors, GPS tracking, industrial monitoring
- **Analytics**: User activity, performance metrics, event streams

## Quick Start

```typescript
import { createChart } from '@xelstack/chart-core';

// Create chart with realtime configuration
const chart = createChart(container, initialDataset, {
  type: 'line',
  width: 800,
  height: 600,
  realtime: {
    enabled: true,
    maxPoints: 500,
    scrollDirection: 'left-to-right',
  },
});

// Add new data points dynamically
chart.addPoints([
  { x: Date.now(), y: 42 },
], {
  autoRender: true,
  autoScroll: true,
});
```

## API Reference

### `addPoints(points, options?)`

Adds new data points to the chart dynamically.

#### Parameters

- **points** (`DataPoint[]`): Array of data points to add
  ```typescript
  interface DataPoint {
    x: number | string | Date;
    y: number;
    series?: string;
    label?: string;
    metadata?: Record<string, unknown>;
  }
  ```

- **options** (`AddPointsOptions`, optional): Configuration options
  ```typescript
  interface AddPointsOptions {
    autoRender?: boolean;  // Auto-render after adding (default: false)
    autoScroll?: boolean;  // Auto-scroll viewport (default: false)
  }
  ```

#### Returns

`void`

#### Examples

```typescript
// Add single point without rendering
chart.addPoints([{ x: 100, y: 50 }]);

// Add multiple points with auto-render
chart.addPoints([
  { x: 100, y: 50 },
  { x: 101, y: 52 },
  { x: 102, y: 48 },
], { autoRender: true });

// Add with auto-scroll (follows new data)
chart.addPoints([{ x: 200, y: 75 }], {
  autoRender: true,
  autoScroll: true,
});

// Multi-series data
chart.addPoints([
  { x: 100, y: 50, series: 'CPU' },
  { x: 100, y: 30, series: 'Memory' },
  { x: 100, y: 20, series: 'Disk' },
], { autoRender: true });
```

### Configuration: `realtime`

Configure realtime behavior in `ChartConfig`.

```typescript
interface RealtimeConfig {
  enabled?: boolean;           // Enable realtime mode (default: false)
  maxPoints?: number;          // Max points to keep (default: 100)
  scrollDirection?: ScrollDirection;  // Scroll direction
}

type ScrollDirection =
  | 'left-to-right'
  | 'right-to-left'
  | 'top-to-bottom'
  | 'bottom-to-top';
```

#### Examples

```typescript
// Basic realtime configuration
{
  realtime: {
    enabled: true,
    maxPoints: 1000,
  }
}

// With custom scroll direction
{
  realtime: {
    enabled: true,
    maxPoints: 500,
    scrollDirection: 'right-to-left',
  }
}
```

## Usage Patterns

### Pattern 1: Time-Series Data Streaming

Continuously stream timestamped data:

```typescript
const chart = createChart(container, { points: [] }, {
  type: 'line',
  realtime: {
    enabled: true,
    maxPoints: 300,  // Keep last 5 minutes at 1 point/sec
  },
  axes: {
    x: {
      label: 'Time',
      format: (value) => new Date(value).toLocaleTimeString(),
    },
    y: {
      label: 'Value',
    },
  },
});

// Stream data every second
setInterval(() => {
  const newPoint = {
    x: Date.now(),
    y: fetchCurrentValue(),
  };

  chart.addPoints([newPoint], {
    autoRender: true,
    autoScroll: true,
  });
}, 1000);
```

### Pattern 2: Multi-Series Live Monitoring

Monitor multiple metrics simultaneously:

```typescript
const metrics = ['CPU', 'Memory', 'Network', 'Disk'];

const chart = createChart(container, { points: [] }, {
  type: 'line',
  realtime: {
    enabled: true,
    maxPoints: 200,
  },
  colors: ['#3366ff', '#ff6633', '#33cc33', '#ff33cc'],
  showLegend: true,
});

// Update all metrics at once
function updateMetrics() {
  const timestamp = Date.now();
  const points = metrics.map(metric => ({
    x: timestamp,
    y: getMetricValue(metric),
    series: metric,
  }));

  chart.addPoints(points, {
    autoRender: true,
    autoScroll: true,
  });
}

setInterval(updateMetrics, 500); // Update every 500ms
```

### Pattern 3: High-Frequency Data (Batch Updates)

Handle high-frequency data efficiently:

```typescript
const chart = createChart(container, initialDataset, {
  type: 'line',
  realtime: {
    enabled: true,
    maxPoints: 1000,
  },
});

// Buffer for high-frequency data
let buffer: DataPoint[] = [];

// Collect data at high frequency
setInterval(() => {
  buffer.push({
    x: Date.now(),
    y: getSensorReading(),
  });
}, 10); // 100 readings/second

// Render in batches at 60fps
setInterval(() => {
  if (buffer.length > 0) {
    chart.addPoints(buffer, {
      autoRender: true,
      autoScroll: true,
    });
    buffer = [];
  }
}, 16); // ~60fps
```

### Pattern 4: WebSocket Data Streaming

Stream data from WebSocket:

```typescript
const chart = createChart(container, { points: [] }, {
  type: 'line',
  realtime: {
    enabled: true,
    maxPoints: 500,
  },
});

const ws = new WebSocket('wss://example.com/data');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  chart.addPoints([{
    x: data.timestamp,
    y: data.value,
    series: data.series,
  }], {
    autoRender: true,
    autoScroll: true,
  });
};
```

### Pattern 5: Manual Render Control

Optimize performance with manual rendering:

```typescript
const chart = createChart(container, initialDataset, {
  type: 'line',
  realtime: {
    enabled: true,
    maxPoints: 1000,
  },
});

// Add multiple updates without rendering
chart.addPoints(batch1, { autoRender: false });
chart.addPoints(batch2, { autoRender: false });
chart.addPoints(batch3, { autoRender: false });

// Single render call
chart.render();
```

## Performance Considerations

### Rendering Frequency

For smooth 60fps rendering:

```typescript
// Good: 60fps (16.67ms per frame)
setInterval(() => {
  chart.addPoints(newData, { autoRender: true });
}, 16);

// Better: RequestAnimationFrame
function update() {
  chart.addPoints(getLatestData(), { autoRender: true });
  requestAnimationFrame(update);
}
requestAnimationFrame(update);

// Best: Batch updates
let batchBuffer = [];
function collectData() {
  batchBuffer.push(getDataPoint());
}
function render() {
  if (batchBuffer.length > 0) {
    chart.addPoints(batchBuffer, { autoRender: true });
    batchBuffer = [];
  }
  requestAnimationFrame(render);
}
setInterval(collectData, 1); // Collect at high frequency
requestAnimationFrame(render); // Render at 60fps
```

### Memory Management

Control memory usage with `maxPoints`:

```typescript
// Short retention (5 minutes at 1Hz)
{
  realtime: {
    maxPoints: 300,
  }
}

// Medium retention (1 hour at 1Hz)
{
  realtime: {
    maxPoints: 3600,
  }
}

// High frequency, short retention (1 minute at 100Hz)
{
  realtime: {
    maxPoints: 6000,
  }
}
```

### Auto-Scroll Behavior

Auto-scroll maintains viewport range while following new data:

```typescript
// Without auto-scroll: viewport stays fixed
chart.addPoints([{ x: 1000, y: 50 }], {
  autoRender: true,
  autoScroll: false,  // New data may be off-screen
});

// With auto-scroll: viewport follows new data
chart.addPoints([{ x: 1000, y: 50 }], {
  autoRender: true,
  autoScroll: true,  // Viewport shifts to include new data
});
```

## Viewport Control

Combine realtime updates with viewport manipulation:

```typescript
// Pause auto-scroll temporarily
let isPaused = false;

function addData(data: DataPoint[]) {
  chart.addPoints(data, {
    autoRender: true,
    autoScroll: !isPaused,  // Only scroll when not paused
  });
}

// User clicks "Pause" button
pauseButton.onclick = () => {
  isPaused = true;
};

// User clicks "Resume" button
resumeButton.onclick = () => {
  isPaused = false;
  chart.resetViewport();  // Jump to latest data
};
```

## Error Handling

Handle edge cases gracefully:

```typescript
try {
  chart.addPoints(newPoints, { autoRender: true });
} catch (error) {
  console.error('Failed to add points:', error);
  // Fallback: recreate chart
  chart.destroy();
  chart = createChart(container, fallbackDataset, config);
}
```

## Performance Benchmarks

Tested performance on standard hardware (see [performance-benchmarks.md](./performance-benchmarks.md)):

| Operation | Target | Actual |
|-----------|--------|--------|
| 1000 points/sec @ 60fps | <200ms/batch | ~2.6ms |
| 100 series update | <50ms | ~0.35ms |
| 10K dataset update | <30ms | ~1.25ms |
| 100 viewport scrolls | <50ms | ~0.18ms |

## Best Practices

### DO:
- ✅ Use `autoRender: false` for bulk operations
- ✅ Batch updates when receiving high-frequency data
- ✅ Set appropriate `maxPoints` for your use case
- ✅ Use `autoScroll` for live monitoring dashboards
- ✅ Measure performance with `performance.now()`

### DON'T:
- ❌ Call `addPoints` with `autoRender: true` at >100Hz
- ❌ Forget to set `maxPoints` for long-running streams
- ❌ Add individual points in a loop with auto-render
- ❌ Use realtime mode for static datasets
- ❌ Ignore memory usage in long-running applications

## Migration Guide

### From Static to Realtime

```typescript
// Before: Static dataset
const chart = createChart(container, staticDataset, config);

// After: Realtime updates
const chart = createChart(container, initialDataset, {
  ...config,
  realtime: {
    enabled: true,
    maxPoints: 1000,
  },
});

// Add new data as it arrives
chart.addPoints(newData, { autoRender: true, autoScroll: true });
```

### From `updateData` to `addPoints`

```typescript
// Before: Full dataset replacement
chart.updateData({ points: [...oldPoints, ...newPoints] });
chart.render();

// After: Incremental updates
chart.addPoints(newPoints, { autoRender: true });
```

## Additional Resources

- [Large Dataset Handling Guide](./large-datasets.md)
- [Performance Benchmarks](./performance-benchmarks.md)
- [API Reference](../README.md)
