# APM 차트 리서치 프로젝트 반영 기록

## 문서 역할

이 문서는 APM 차트 리서치에서 나온 주장을 `xel-stack/chart`의 현재 v1 범위에 맞게 채택/보류/후속화한 결정 기록이다.

쉬운 용어 풀이와 Prometheus식 metric processing/chart rendering 책임 분리는 `20260625_apm_chart_mental_model.md`를 본다.

## 발견

Claude가 작성했던 APM 차트 리서치 원자료는 일반 차트 라이브러리가 아니라 APM/Observability 제품에 들어갈 수 있는 시계열 차트가 무엇을 갖춰야 하는지 정리한 자료다.

이 자료의 핵심은 다음이다.

- APM 차트의 핵심은 예쁜 선을 그리는 것이 아니라 많은 데이터를 정직하게 줄여서 보여주는 것이다.
- 브라우저에서 raw data를 전부 렌더링하는 방식은 성능 목표를 만족하기 어렵다.
- 렌더링 대상은 raw data 개수가 아니라 화면 픽셀 수에 맞게 제한되어야 한다.
- `object` point 배열은 사용성에는 좋지만, APM급 hot path로 쓰면 안 된다.
- typed-array/columnar 입력, ring buffer, visible slice, downsampling, scheduler, benchmark가 성능의 중심이다.
- latency/percentile/heatmap 같은 APM 고유 문제는 line/area v1 이후 별도 milestone으로 다뤄야 한다.

이 문서는 원자료를 그대로 보관하는 문서가 아니다. 현재 `xel-stack/chart`의 v1 범위에 맞게 반영할 것과 보류할 것을 나눈 프로젝트용 기술 기록이다.

## 프로젝트 기준 해석

### v1 목표는 그대로 유지한다

현재 프로젝트의 v1 목표는 다음이다.

```text
Chart.js처럼 시작하기 쉬운 API
+ uPlot에서 영감을 받은 columnar 내부 구조
+ APM-style realtime line/area 성능 경로
```

따라서 원자료에 있는 모든 APM 기능을 v1에 넣지 않는다.

v1에 포함:

- realtime `line`
- realtime `area`
- object/tuple/typed-array append 입력
- typed-array append hard performance path
- series-local columnar storage
- visible slice
- automatic downsampling
- RAF scheduler

v1에서 제외:

- latency heatmap
- DDSketch/HdrHistogram/t-digest 직접 입력
- percentile band
- anomaly baseline
- exemplar/trace drilldown
- synchronized crosshair
- brush zoom
- WebGL/WebGPU renderer
- Worker/OffscreenCanvas/SAB 기반 ingest architecture

이 기능들은 중요하지만, v1 line/area 성능 경로가 만들어진 뒤 후속 milestone에서 다룬다.

### `10MB/s`는 아직 고정 성능 목표가 아니다

원자료는 `10MB/s @ 60fps`를 공격적인 목표로 제시한다. 하지만 이 숫자는 먼저 정의가 필요하다.

같은 `10MB/s`라도 포맷에 따라 의미가 완전히 달라진다.

| 포맷                     | 의미                      | 프로젝트 판단                                          |
| ------------------------ | ------------------------- | ------------------------------------------------------ |
| JSON point array         | 파싱 비용이 매우 큼       | APM hard path로 보지 않는다.                           |
| raw `Float64Array` x/y   | 내부 모델과 가장 가까움   | v1 hard path의 기준으로 삼는다.                        |
| 압축 binary/Gorilla 계열 | 전송량은 작지만 복원 필요 | 후속 wire format/worker milestone에서 별도로 검토한다. |

따라서 지금 당장 `10MB/s`를 acceptance로 박으면 안 된다.

현재 단계에서의 결정:

```text
성능 주장은 typed-array append 기준으로 측정한다.
JSON ingest나 압축 wire format은 v1 hard target이 아니다.
```

### `60fps`의 의미도 다시 정의한다

APM 차트에서 `60fps`는 16ms마다 새 데이터를 만들어야 한다는 뜻이 아니다.

프로젝트에서 `60fps`는 다음 의미로 쓴다.

```text
데이터가 몰려 들어와도 UI를 긴 시간 멈추지 않고,
렌더 작업이 가능하면 frame budget 안에서 끝나며,
초과 작업은 다음 frame으로 넘길 수 있어야 한다.
```

즉 목표는 매 frame마다 전체 데이터를 다시 그리는 것이 아니다.

목표는 다음이다.

```text
append 여러 번 발생
-> chart dirty 표시
-> RAF render 1회로 합치기
-> visible slice만 조회
-> pixel-bounded downsampling
-> draw
```

### typed-array append가 hard path다

이 프로젝트에서 `typed-array append hard path`는 APM급 성능 주장을 검증할 기준 입력 경로를 뜻한다.

```ts
chart.append("cpu", {
  x: new Float64Array([t1, t2, t3]),
  y: new Float64Array([42, NaN, 44]),
});
```

이 경로는 point 객체 생성, object array 재구성, renderer의 `DataPoint[]` 요구로 느려지면 안 된다.

object/tuple 입력은 계속 지원하지만 사용성 경로로 본다. 상세한 용어 풀이는 `20260625_apm_chart_mental_model.md`의 `hard path`, `typed-array`, `columnar` 항목을 따른다.

### input normalization은 성능 경계다

`task_m001_004 input normalization boundary`는 단순 변환 함수가 아니다.

이 task는 public input과 internal numeric hot path 사이의 경계를 만든다.

```text
사용자 친화 입력
  PointObject[]
  PointTuple[]
  ColumnarPointBatch

-> 내부 성능 입력
  numeric x column
  numeric y column
  length
  gap = NaN
```

이 경계 이후의 hot path는 object shape를 몰라야 한다. 수행계획서에는 이 점을 핵심 목표로 반영한다.

따라서 `task_m001_004`에서 반드시 지켜야 할 판단:

- `Date`는 여기서 epoch milliseconds로 변환한다.
- `null`은 여기서 `NaN`으로 변환한다.
- typed-array 입력은 가능한 한 그대로 통과시킨다.
- typed-array 입력에서 x/y length가 다르면 실패로 처리한다.
- object/tuple 입력은 convenience path로 보고 변환 비용을 허용한다.
- 이 단계에서 `SeriesBuffer`, scheduler, renderer까지 구현하지 않는다.

### SeriesBuffer는 ring/chunked buffer로 진화할 수 있어야 한다

원자료는 typed-array ring buffer를 강하게 권장한다. 방향은 맞다.

다만 현재 프로젝트 단계에서 처음부터 다음을 한 번에 구현하지 않는다.

- SharedArrayBuffer
- Worker ingest
- OffscreenCanvas rendering
- 압축 ring buffer
- global byte budget

대신 `SeriesBuffer` 설계에서 다음 개념을 열어둔다.

- series별 x/y column 소유권
- logical length
- append batch
- ordered fast path
- visible slice view
- capacity 또는 retention 옵션을 나중에 넣을 수 있는 구조
- chunked/ring 형태로 교체 가능한 내부 구현

즉 초기 구현은 단순할 수 있지만, public API나 renderer가 `DataPoint[]`에 묶이면 안 된다.

### Downsampling은 평균이 아니라 spike 보존이 기준이다

APM에서 순간 spike는 장애 신호일 수 있다. 평균으로 줄이면 중요한 spike가 사라질 수 있다.

따라서 현재 도메인 문서의 M4 기본 후보는 타당하다.

프로젝트 기준:

- line/area v1의 기본 내부 후보는 M4로 유지한다.
- benchmark에서 MinMax, M4, MinMaxLTTB를 비교한다.
- 평균 downsampling은 기본 후보로 두지 않는다.
- `NaN` gap은 downsampling 후에도 선이 이어지면 안 된다.

자세한 용어 설명은 `20260625_apm_chart_mental_model.md`의 `downsampling`, `M4`, `spike` 항목을 따른다.

### Worker/OffscreenCanvas는 지금 당장 구현하지 않는다

원자료는 Worker/OffscreenCanvas/SAB를 P0로 제안한다. 장기 목표로는 이해된다.

하지만 현재 프로젝트는 아직 다음도 없다.

- runtime `createChart`
- `SeriesBuffer`
- visible slice
- downsampling
- scheduler
- renderer interface
- benchmark harness

따라서 지금 Worker부터 들어가면 학습 비용과 설계 복잡도가 너무 커진다.

현재 결정:

```text
M001에서는 main-thread Canvas 2D 기준으로 최소 runtime path를 만든다.
단, renderer/scheduler/buffer 경계는 Worker/OffscreenCanvas로 이동 가능하게 설계한다.
```

다시 볼 시점:

- typed-array append benchmark가 생긴 뒤
- SeriesBuffer와 downsampling이 구현된 뒤
- main-thread long task가 실제로 관측된 뒤
- browser compatibility/COOP/COEP 배포 제약을 조사할 때

### WebGL/WebGPU는 renderer interface 이후로 미룬다

고밀도 시나리오에서 WebGL/WebGPU가 필요해질 수 있다는 주장도 타당하다.

다만 지금은 renderer backend보다 다음이 먼저다.

1. 데이터를 object에서 columnar로 바꾸는 경계
2. columnar 데이터를 저장하는 buffer
3. viewport로 필요한 slice만 고르는 query
4. 화면 픽셀 수에 맞게 줄이는 downsampling
5. 그 결과를 그리는 renderer interface

즉 WebGL/WebGPU를 지금 구현하지 않는다. 대신 renderer interface가 `RenderFrame`을 받도록 만들어 나중에 Canvas/WebGL/WebGPU backend를 바꿀 수 있게 한다.

### percentile, sketch, heatmap은 후속 milestone이다

원자료에서 가장 중요한 APM 도메인 사실 중 하나는 percentile과 평균에 관한 내용이다.

요약:

- latency 평균은 장애 신호를 숨길 수 있다.
- percentile은 단순 평균하면 수학적으로 틀릴 수 있다.
- heatmap은 latency 분포를 더 정직하게 보여줄 수 있다.
- DDSketch/HdrHistogram 같은 sketch는 분포를 작게 요약하고 merge하는 데 유용하다.

이 내용은 중요하지만 현재 `line | area` v1에는 직접 넣지 않는다.

후속 milestone 후보:

- `M002`: diagnostics/benchmark/retention
- `M003`: latency percentile band
- `M004`: heatmap/distribution input
- `M005`: trace/exemplar overlay

현재 task에 주는 영향:

```text
line/area downsampling은 spike와 gap을 보존해야 한다.
미래의 distribution/heatmap path와 scalar line path를 섞지 않는다.
```

## 결정

### 결정 1: 원자료는 v1 범위에 맞게 축소 반영한다

원자료의 큰 방향은 맞지만, v1에 모두 넣지 않는다.

v1은 `line | area`와 typed-array append 성능 경로에 집중한다.

### 결정 2: `task_m001_004`의 의미를 상향한다

`task_m001_004`는 단순 입력 타입 변환이 아니라 APM 성능 경로의 입구다.

수행계획서에는 다음 표현을 반영한다.

```text
input normalization boundary는 object/tuple/typed-array public input을
internal numeric columnar batch로 encode하는 성능 경계다.
```

### 결정 3: benchmark suite는 너무 늦게 만들지 않는다

benchmark는 완성 후 마케팅 자료가 아니다.

다음 구성 요소가 생기는 시점에 함께 만든다.

- `SeriesBuffer`
- visible slice
- downsampling
- scheduler

초기 benchmark 대상:

- typed-array append throughput
- append 후 render invalidation cost
- visible slice query cost
- downsampling cost
- steady-state allocation

### 결정 4: 어려운 기능은 후속 milestone으로 분리한다

다음 항목은 중요하지만 지금은 보류한다.

- Worker ingest
- SharedArrayBuffer
- OffscreenCanvas
- WebGL/WebGPU
- DDSketch/HdrHistogram/t-digest
- latency heatmap
- percentile band
- exemplar/trace drilldown
- client LOD store

보류 이유:

- 현재 runtime path가 아직 없다.
- v1 line/area 내부 모델이 먼저 필요하다.
- premature architecture가 되면 사용자가 직접 이해하며 코딩하기 어려워진다.

## 근거

### 프로젝트 내부 근거

- `docs/domain/03-domain-model.md`
- `docs/domain/04-invariants.md`
- `docs/domain/05-workflows.md`
- `docs/domain/06-api-contract.md`
- `docs/hyper-waterfall/reports/task_m001_003_report.md`

### 원자료의 주요 외부 근거

원자료는 다음 계열의 문서와 글을 근거로 한다.

- Datadog DDSketch, heatmap, dashboard/rollup 관련 문서
- Grafana max data points, DataFrame, uPlot 사용 사례
- New Relic realtime streaming, chart refresh, APM response time chart
- Dynatrace metric resolution, adaptive baseline, multidimensional analysis
- Honeycomb heatmap과 BubbleUp
- Prometheus histogram/summary와 percentile 집계 주의점
- uPlot benchmark
- M4, LTTB, MinMaxLTTB 관련 논문/글
- Gorilla time-series compression 논문
- HdrHistogram/DDSketch/t-digest 자료

이 문서에서는 외부 주장 중 프로젝트 의사결정에 직접 필요한 것만 채택한다. 숫자 기반 hard target은 나중에 프로젝트 benchmark로 다시 검증한다.

## 다시 볼 시점

- `task_m001_004` 수행계획서를 작성할 때
- `SeriesBuffer` task를 시작할 때
- downsampling 구현계획서를 작성할 때
- RAF scheduler 구현계획서를 작성할 때
- benchmark suite task를 시작할 때
- Worker/OffscreenCanvas/WebGL/WebGPU 도입 여부를 결정할 때
