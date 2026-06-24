# API 계약: 실시간 Line/Area 차트

## 목적

이 문서는 v1 public API 계약을 정의한다. 목표는 Chart.js처럼 시작하기 쉽지만, Chart.js와 100% 호환되는 drop-in replacement가 아니라는 점을 명확히 하는 것이다.

## 포지셔닝

```text
Chart.js와 비슷한 사용성
+ uPlot에서 영감을 받은 columnar 내부 구조
+ APM급 realtime line/area 성능 경로
```

## 생성

```ts
const chart = createChart(canvas, {
  type: "line",
  realtime: true,
  data: {
    datasets: [
      {
        id: "cpu-user",
        label: "CPU user",
        data: [],
      },
    ],
  },
});
```

지원하는 v1 차트 타입:

```ts
type ChartType = "line" | "area";
```

지원하는 v1 scale:

```text
x: time
y: linear
```

## 데이터 추가(Append)

### 쉬운 Object 입력

```ts
chart.append("cpu-user", [
  { x: Date.now(), y: 42 },
  { x: Date.now() + 1000, y: null },
]);
```

### 더 빠른 Tuple 입력

```ts
chart.append("cpu-user", [
  [Date.now(), 42],
  [Date.now() + 1000, null],
]);
```

### 가장 빠른 Typed-Array 입력

```ts
chart.append("cpu-user", {
  x: new Float64Array([t1, t2, t3]),
  y: new Float64Array([42, NaN, 44]),
});
```

Typed-array input이 hard performance path다.

## 호환 Update

```ts
chart.data.datasets[0].data.push({ x: Date.now(), y: 42 });
chart.update();
```

이 경로는 익숙한 사용성을 위해 존재한다. hard realtime performance path는 아니다.

## 표시 여부

```ts
chart.setSeriesVisible("cpu-user", false);
chart.setSeriesVisible("cpu-user", true);
```

Visibility 변경은 render state를 invalidate하고 다음 RAF render pass에서 적용된다.

## 정리(Destroy)

```ts
chart.destroy();
```

선호하는 v1 동작:

- duplicate `destroy()` is a no-op.
- mutating methods after destroy throw a clear error.

## 입력 계약

```ts
type TimeValue = number | Date;
type YValue = number | null;
```

규칙:

- `number` x means epoch milliseconds.
- `Date` x is converted with `getTime()`.
- string x is not part of v1 realtime API.
- `null` y means gap.
- typed-array y uses `NaN` as gap sentinel.

## 실시간 계약

명시적 realtime 사용:

```ts
realtime: true;
```

의미:

- append path is enabled.
- internal storage uses columnar series buffers.
- render is scheduled through RAF.
- downsampling is automatic.
- public `flush()` is not available.

내부 기본값:

```ts
{
  enabled: false,
  ordered: true;
}
```

`realtime`을 생략하면 realtime append/scheduler path는 비활성화된다. 사용자가 `realtime: true` 또는 `realtime: { ordered }`를 명시한 경우에만 realtime path를 활성화한다.

가장 빠른 경로를 위해 같은 series에는 non-decreasing x 값이 들어와야 한다.

## 성능 계약

| 입력 경로                 | Public 목적              | 성능 목표          |
| ------------------------- | ------------------------ | ------------------ |
| typed-array append        | APM-grade ingestion      | hard target        |
| tuple append              | fast ergonomic ingestion | high target        |
| object append             | easiest ingestion        | convenience target |
| dataset mutation + update | compatibility            | no hard APM target |

라이브러리는 이 차이를 명확히 문서화해야 한다. 사용자는 쉬운 경로로 시작하고, ingestion volume이 커지면 typed-array path로 이동할 수 있어야 한다.

## Interaction 계약

v1 포함:

- hover tooltip
- nearest point lookup
- legend display
- legend toggle

v1 제외:

- zoom
- pan
- brush selection
- cross-chart sync
- annotation editing

## Diagnostics 계약

내부 event는 존재한다.

- `InvalidPointDropped`
- `OutOfOrderPointDropped`
- `DownsampleApplied`
- `FrameBudgetExceeded`

이 event들은 v1 public API가 아니다. 미래의 diagnostics API가 별도로 노출할 수 있다.

## 하지 않는 것

v1은 다음을 약속하지 않는다.

- Chart.js drop-in replacement behavior
- Chart.js plugin compatibility
- all Chart.js scale types
- all chart types
- hard realtime performance for object mutation + `update()`
