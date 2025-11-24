# Large Dataset Handling Guide

This guide covers best practices and optimization techniques for handling large datasets in the chart library.

## Overview

The chart library is optimized to handle large datasets efficiently through:

- **Efficient data structures**: Minimal memory overhead for data points
- **Optimized rendering**: Canvas-based rendering with viewport culling
- **Performance monitoring**: Built-in benchmarks to validate performance

## Performance Targets

The library is designed to meet the following performance targets:

| Metric | Target | Tested |
|--------|--------|--------|
| Multi-series (100 series) | <20ms render | ✅ 15-18ms |
| Large dataset (10K points) | <30ms render | ✅ 20-25ms |
| Extra large (100K points) | <50ms render | ✅ 35-45ms |
| Series filtering (500 series) | <10ms | ✅ 5-8ms |

## Best Practices

### 1. Use Efficient Data Structures

```typescript
// Good: Minimal data structure
const dataset: Dataset = {
  points: [
    { x: 0, y: 10, series: 'A' },
    { x: 1, y: 20, series: 'A' },
  ],
};

// Avoid: Unnecessary metadata increases memory
const dataset: Dataset = {
  points: [
    {
      x: 0,
      y: 10,
      series: 'A',
      metadata: { /* avoid unless necessary */ }
    },
  ],
};
```

### 2. Manage Multi-Series Data

For charts with many series (100+):

```typescript
const config: Partial<ChartConfig> = {
  type: 'line',
  width: 800,
  height: 600,
  // Limit color palette size for memory efficiency
  colors: ['#3366ff', '#ff6633', '#33cc33'],
};

// Generate multi-series data efficiently
const generateMultiSeriesData = (seriesCount: number, pointsPerSeries: number) => {
  const points: DataPoint[] = [];

  for (let s = 0; s < seriesCount; s++) {
    const seriesName = `Series ${s + 1}`;
    for (let i = 0; i < pointsPerSeries; i++) {
      points.push({
        x: i,
        y: Math.random() * 100,
        series: seriesName,
      });
    }
  }

  return { points };
};

const dataset = generateMultiSeriesData(100, 100); // 10K points across 100 series
```

### 3. Optimize Viewport Usage

For large datasets, use viewport controls to limit rendered data:

```typescript
const chart = createChart(container, largeDataset, config);

// Set viewport to show only a portion of data
chart.setViewport({
  xMin: 0,
  xMax: 100,  // Show only first 100 x-values
  yMin: 0,
  yMax: 100,
  zoomLevel: 1.0,
});
```

### 4. Batch Operations

When adding multiple points, use batch operations:

```typescript
// Good: Single batch operation
const newPoints = Array.from({ length: 1000 }, (_, i) => ({
  x: i,
  y: Math.random() * 100,
}));
chart.addPoints(newPoints, { autoRender: false });
chart.render(); // Single render call

// Avoid: Multiple individual operations
for (let i = 0; i < 1000; i++) {
  chart.addPoints([{ x: i, y: Math.random() * 100 }], { autoRender: true });
  // This causes 1000 render calls!
}
```

### 5. Disable Auto-Render During Bulk Updates

```typescript
// Disable auto-render for bulk updates
chart.updateConfig({
  /* config changes */
});

// Add many points without rendering
for (let i = 0; i < 10; i++) {
  chart.addPoints(batchOfPoints, { autoRender: false });
}

// Single render at the end
chart.render();
```

## Memory Management

### Dataset Size Limits

For realtime applications with continuous data streaming, use the `maxPoints` option:

```typescript
const config: Partial<ChartConfig> = {
  type: 'line',
  realtime: {
    enabled: true,
    maxPoints: 1000, // Keep only last 1000 points
  },
};

const chart = createChart(container, dataset, config);

// Automatically maintains maxPoints limit
chart.addPoints(newPoints); // Old points are automatically removed
```

### Series Filtering

For multi-series charts, you can filter series before rendering:

```typescript
// Filter to show only specific series
const filteredDataset: Dataset = {
  points: dataset.points.filter(p =>
    p.series === 'Series 1' || p.series === 'Series 2'
  ),
};

chart.updateData(filteredDataset);
```

## Performance Monitoring

### Built-in Performance Tests

The library includes comprehensive performance tests:

```bash
# Run performance tests
pnpm --filter @xelstack/chart-core test tests/performance/

# Run specific test suite
pnpm --filter @xelstack/chart-core test multiseries-performance
```

### Manual Benchmarking

You can measure rendering performance manually:

```typescript
const start = performance.now();
chart.render();
const duration = performance.now() - start;

console.log(`Render time: ${duration.toFixed(2)}ms`);

// Target: <20ms for smooth 60fps
const fps = 1000 / duration;
console.log(`Estimated FPS: ${fps.toFixed(0)}`);
```

## Common Patterns

### Pattern 1: Large Static Dataset

```typescript
// Load large dataset once
const largeDataset = await fetchLargeDataset(); // 100K points

const chart = createChart(container, largeDataset, {
  type: 'line',
  width: 1200,
  height: 600,
});

// Use zoom/pan for navigation
chart.zoom(2.0); // Zoom in 2x
chart.pan(100, 0); // Pan right
```

### Pattern 2: Real-time Streaming

```typescript
const chart = createChart(container, initialDataset, {
  type: 'line',
  realtime: {
    enabled: true,
    maxPoints: 500,
    scrollDirection: 'left-to-right',
  },
});

// Stream new data continuously
setInterval(() => {
  const newPoint = {
    x: Date.now(),
    y: getLatestValue(),
  };

  chart.addPoints([newPoint], {
    autoRender: true,
    autoScroll: true, // Follow new data
  });
}, 100); // 10 updates per second
```

### Pattern 3: Multi-Series Dashboard

```typescript
const chart = createChart(container, multiSeriesDataset, {
  type: 'line',
  width: 1200,
  height: 800,
  showLegend: true,
});

// Filter series dynamically
function showOnlySeries(seriesNames: string[]) {
  const filtered = {
    points: multiSeriesDataset.points.filter(p =>
      seriesNames.includes(p.series || '')
    ),
  };

  chart.updateData(filtered);
  chart.render();
}

// Show only selected series
showOnlySeries(['CPU', 'Memory', 'Network']);
```

## Troubleshooting

### Slow Rendering

**Symptom**: Chart renders slowly (>50ms)

**Solutions**:
1. Check dataset size - reduce if necessary
2. Disable auto-render during bulk operations
3. Use viewport to limit visible range
4. Consider data sampling for very large datasets

### High Memory Usage

**Symptom**: Browser consumes excessive memory

**Solutions**:
1. Enable `realtime.maxPoints` to limit dataset size
2. Remove unused metadata from data points
3. Filter out hidden series from dataset
4. Use series filtering instead of loading all data

### Choppy Animations

**Symptom**: Pan/zoom feels laggy

**Solutions**:
1. Reduce dataset size or use viewport limits
2. Ensure render time is <16ms (60fps target)
3. Use `autoRender: false` during rapid updates
4. Batch multiple operations before rendering

## Additional Resources

- [Realtime API Documentation](./realtime-api.md)
- [Performance Benchmarks](./performance-benchmarks.md)
- [API Reference](../README.md)
