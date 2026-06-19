# API Contract: Realtime Line/Area Chart

## Purpose

이 문서는 v1 public API 계약을 정의한다. 목표는 Chart.js처럼 시작하기 쉽지만, Chart.js와 100% 호환되는 drop-in replacement가 아니라는 점을 명확히 하는 것이다.

## Positioning

```text
Chart.js-like ergonomics
+ uPlot-inspired columnar internals
+ APM-grade realtime line/area performance path
```

## Create

```ts
const chart = createChart(canvas, {
  type: "line",
  realtime: true,
  data: {
    datasets: [
      {
        id: "cpu-user",
        label: "CPU user",
        data: []
      }
    ]
  }
});
```

Supported v1 chart types:

```ts
type ChartType = "line" | "area";
```

Supported v1 scales:

```text
x: time
y: linear
```

## Append

### Easy Object Input

```ts
chart.append("cpu-user", [
  { x: Date.now(), y: 42 },
  { x: Date.now() + 1000, y: null }
]);
```

### Faster Tuple Input

```ts
chart.append("cpu-user", [
  [Date.now(), 42],
  [Date.now() + 1000, null]
]);
```

### Fastest Typed-Array Input

```ts
chart.append("cpu-user", {
  x: new Float64Array([t1, t2, t3]),
  y: new Float64Array([42, NaN, 44])
});
```

Typed-array input is the hard performance path.

## Compatibility Update

```ts
chart.data.datasets[0].data.push({ x: Date.now(), y: 42 });
chart.update();
```

This path exists for familiarity. It is not the hard realtime performance path.

## Visibility

```ts
chart.setSeriesVisible("cpu-user", false);
chart.setSeriesVisible("cpu-user", true);
```

Visibility changes invalidate render state and are applied on the next RAF render pass.

## Destroy

```ts
chart.destroy();
```

Preferred v1 behavior:

- duplicate `destroy()` is a no-op.
- mutating methods after destroy throw a clear error.

## Input Contract

```ts
type TimeValue = number | Date;
type YValue = number | null;
```

Rules:

- `number` x means epoch milliseconds.
- `Date` x is converted with `getTime()`.
- string x is not part of v1 realtime API.
- `null` y means gap.
- typed-array y uses `NaN` as gap sentinel.

## Realtime Contract

Default:

```ts
realtime: true
```

Meaning:

- append path is enabled.
- internal storage uses columnar series buffers.
- render is scheduled through RAF.
- downsampling is automatic.
- public `flush()` is not available.

Internal default:

```ts
{
  ordered: true
}
```

The same series should receive non-decreasing x values for the fastest path.

## Performance Contract

| Input path | Public purpose | Performance target |
| --- | --- | --- |
| typed-array append | APM-grade ingestion | hard target |
| tuple append | fast ergonomic ingestion | high target |
| object append | easiest ingestion | convenience target |
| dataset mutation + update | compatibility | no hard APM target |

The library should document this clearly. Users can start easy and move to the typed-array path when ingestion volume grows.

## Interaction Contract

Included in v1:

- hover tooltip
- nearest point lookup
- legend display
- legend toggle

Excluded from v1:

- zoom
- pan
- brush selection
- cross-chart sync
- annotation editing

## Diagnostics Contract

Internal events exist:

- `InvalidPointDropped`
- `OutOfOrderPointDropped`
- `DownsampleApplied`
- `FrameBudgetExceeded`

They are not public API in v1. A future diagnostics API may expose them separately.

## Non-Goals

v1 does not promise:

- Chart.js drop-in replacement behavior
- Chart.js plugin compatibility
- all Chart.js scale types
- all chart types
- hard realtime performance for object mutation + `update()`
