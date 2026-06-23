# 도메인 모델: 실시간 Line/Area 차트

## 목적

이 문서는 구현자가 바로 TypeScript 타입과 테스트로 옮길 수 있는 v1 도메인 모델을 정의한다.

## Public 타입

```ts
type ChartType = "line" | "area";

interface ChartConfig {
  type: ChartType;
  realtime?: boolean | RealtimeOptions;
  data: ChartData;
  options?: ChartOptions;
}

interface ChartData {
  datasets: DatasetConfig[];
}

interface DatasetConfig {
  id?: string;
  label?: string;
  data: PointObject[] | PointTuple[] | ColumnarPointBatch;
}
```

Chart.js-like 이름을 사용하지만, Chart.js drop-in replacement를 목표로 하지 않는다.

## Realtime 옵션

초기 public API는 단순해야 한다.

```ts
type RealtimeOptions =
  | true
  | {
      ordered?: boolean;
    };
```

기본값:

```ts
{
  ordered: true;
}
```

`viewWindow`, `maxPoints`, `maxBytes`, public diagnostics API는 v1 core domain의 확장 포인트로 남긴다. 기본 API에는 강제하지 않는다.

## 입력 값

```ts
type TimeValue = number | Date;
type YValue = number | null;

interface PointObject {
  x: TimeValue;
  y: YValue;
}

type PointTuple = readonly [TimeValue, YValue];

interface ColumnarPointBatch {
  x: Float64Array;
  y: Float64Array;
}

type AppendInput =
  | readonly PointObject[]
  | readonly PointTuple[]
  | ColumnarPointBatch;
```

규칙:

- `number` x는 epoch milliseconds다.
- `Date` x는 `getTime()`으로 epoch milliseconds로 변환한다.
- string x는 v1 realtime path에서 지원하지 않는다.
- `null` y는 내부에서 `NaN` gap sentinel로 encode한다.
- typed-array fast path에서 `NaN` y는 gap으로 해석한다.

## Series

```ts
type SeriesId = string;

interface SeriesDescriptor {
  id: SeriesId;
  label: string;
  type: ChartType;
  visible: boolean;
}
```

`Series`는 차트 위에 그려지는 하나의 시계열 line/area를 의미한다. public config의 `DatasetConfig`는 내부에서 stable `SeriesDescriptor`와 `SeriesBuffer`로 분리된다.

## Columnar Storage

```ts
interface SeriesBuffer {
  seriesId: SeriesId;
  x: Float64Array;
  y: Float64Array;
  length: number;
  ordered: boolean;
  lastX: number | undefined;
}
```

설계 결정:

- 각 series는 자기 x/y columns를 가진다.
- 모든 series가 공통 x 배열을 공유하지 않는다.
- append-mostly workload를 기준으로 최적화한다.

## Chart State

```ts
interface ChartState {
  chartId: string;
  type: ChartType;
  realtime: RealtimeRuntimeState;
  series: Map<SeriesId, SeriesDescriptor>;
  buffers: Map<SeriesId, SeriesBuffer>;
  viewport: ViewportState;
  render: RenderRuntimeState;
  destroyed: boolean;
}

interface RealtimeRuntimeState {
  enabled: boolean;
  ordered: boolean;
}
```

## Viewport

```ts
interface ViewportState {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  pixelWidth: number;
  pixelHeight: number;
}

interface VisibleSeriesSlice {
  seriesId: SeriesId;
  x: Float64Array;
  y: Float64Array;
  start: number;
  end: number;
}
```

`start`는 inclusive이고 `end`는 exclusive다.

## Downsample 정책

```ts
type DownsampleMode = "auto" | "off";
type DownsampleAlgorithm = "m4" | "minmax" | "minmax-lttb";

interface DownsamplePolicy {
  mode: DownsampleMode;
  algorithm: DownsampleAlgorithm;
  threshold: number;
}
```

기본 내부 후보:

```ts
{
  mode: "auto",
  algorithm: "m4",
  threshold: 2
}
```

Public API는 처음부터 이 옵션 전체를 노출하지 않는다. 내부 policy로 유지하고 benchmark 결과에 따라 기본값을 조정한다.

## Render Frame

```ts
interface RenderFrame {
  viewport: ViewportState;
  series: RenderSeries[];
}

interface RenderSeries {
  seriesId: SeriesId;
  type: ChartType;
  x: Float64Array;
  y: Float64Array;
  segments: RenderSegment[];
}

interface RenderSegment {
  start: number;
  end: number;
}
```

Segments는 gap 때문에 끊어진 line/area path를 표현한다.

## 명령

```ts
type ChartCommand =
  | CreateChart
  | AppendPoints
  | UpdateFromDatasetMutation
  | SetSeriesVisibility
  | ResizeViewport
  | ResolveTooltipTarget
  | DestroyChart;
```

Public mutable methods는 내부 command로 변환된다.

## 이벤트

```ts
type ChartEvent =
  | PointsAppended
  | InvalidPointDropped
  | OutOfOrderPointDropped
  | ChartInvalidated
  | RenderScheduled
  | DownsampleApplied
  | FrameBudgetExceeded
  | RenderCompleted
  | SeriesVisibilityChanged;
```

이벤트는 v1에서 내부 전용이다. public API의 일부가 아니다.
