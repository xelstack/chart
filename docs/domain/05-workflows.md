# Workflows: Realtime Line/Area Chart

## Purpose

이 문서는 public method가 내부 command/event/render pipeline으로 어떻게 흘러가는지 정의한다.

## Workflow: Create Chart

```text
createChart(canvas, config)
-> validate config
-> normalize Chart.js-like config
-> register series descriptors
-> encode initial dataset input
-> initialize SeriesBuffer per series
-> initialize viewport and scheduler
-> schedule initial render
-> return Chart facade
```

Rules:

- invalid chart type은 throw한다.
- v1 chart type은 `"line"` 또는 `"area"`다.
- `realtime: true`는 realtime engine을 활성화한다.
- missing dataset `id`는 stable internal id로 보정할 수 있지만, realtime append path에서는 explicit id를 권장한다.

## Workflow: Append Points

```text
chart.append(seriesId, input)
-> AppendPoints command
-> validate seriesId
-> normalize input shape
-> encode x/y values
-> validate ordered invariant
-> append to SeriesBuffer
-> emit PointsAppended or InvalidPointDropped
-> mark chart invalidated
-> schedule RAF render if not already scheduled
```

Input shapes:

```ts
chart.append("cpu", [{ x, y }])
chart.append("cpu", [[x, y]])
chart.append("cpu", { x: Float64Array, y: Float64Array })
```

Performance tiers:

- object input: easiest
- tuple input: faster
- typed-array input: fastest and hard performance target

## Workflow: Compatibility Update

```text
chart.data.datasets[n].data.push(point)
chart.update()
-> UpdateFromDatasetMutation command
-> detect or rebuild changed dataset snapshot
-> normalize through compatibility path
-> update matching SeriesBuffer
-> mark chart invalidated
-> schedule RAF render
```

Rules:

- compatibility path is supported for ergonomics.
- hard APM performance target does not apply to this path.
- compatibility path must not force renderer to consume `DataPoint[]`.

## Workflow: RAF Render Pass

```text
requestAnimationFrame
-> collect invalidated chart state
-> resolve viewport
-> select visible series
-> query visible slices by binary search
-> downsample if needed
-> produce RenderFrame
-> CanvasRenderer.draw(RenderFrame)
-> emit RenderCompleted
```

Scheduler priorities:

1. current viewport
2. visible series
3. latest data
4. interaction lookup data
5. non-visible or deferred work

If frame budget is exceeded:

```text
-> emit FrameBudgetExceeded
-> carry deferred work to next frame
```

## Workflow: Viewport Query

```text
SeriesBuffer.x
-> binary search xMin
-> binary search xMax
-> produce VisibleSeriesSlice
```

Precondition:

- series x column is ordered.

If ordered invariant is not available, the engine must use a slower path or reject that path from hard performance guarantees.

## Workflow: Downsample

```text
VisibleSeriesSlice
-> if visiblePointCount <= pixelWidth * threshold: use as-is
-> else apply DownsamplePolicy
-> produce render x/y arrays and gap segments
```

Default candidate:

```text
M4: first, min, max, last per bucket
```

Rules:

- spike preservation is required.
- `NaN` gaps must remain gaps.
- downsampling output must be bounded by screen resolution, not by retained raw data size.

## Workflow: Hover Tooltip

```text
pointer move
-> ResolveTooltipTarget command
-> transform pixel x to time x
-> search visible/raw index for nearest point
-> ignore hidden series
-> ignore gap values
-> update tooltip state
-> schedule lightweight overlay render if needed
```

Rules:

- tooltip lookup must not block main render path.
- nearest point search should use visible/raw index, not only downsampled output, when practical.

## Workflow: Legend Toggle

```text
legend click
-> SetSeriesVisibility command
-> update SeriesDescriptor.visible
-> emit SeriesVisibilityChanged
-> mark chart invalidated
-> schedule RAF render
```

Rules:

- hidden series remains in storage.
- hidden series is excluded from downsample/render work.

## Workflow: Resize

```text
ResizeObserver or explicit resize
-> ResizeViewport command
-> update pixelWidth/pixelHeight
-> invalidate viewport and render frame
-> schedule RAF render
```

## Workflow: Destroy

```text
chart.destroy()
-> DestroyChart command
-> cancel scheduled render work
-> remove event listeners
-> release references
-> mark state destroyed
-> emit ChartDestroyed
```

After destroy, public method behavior must be explicit. Preferred v1 behavior:

- `append`, `update`, `setSeriesVisible` after destroy throw a clear error.
- duplicate `destroy()` is a no-op.
