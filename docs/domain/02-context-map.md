# Context Map: Realtime Line/Area Chart

## Purpose

이 문서는 v1 도메인의 bounded context와 의존 방향을 정의한다. 핵심 원칙은 public API를 쉽게 유지하되, 내부 성능 엔진이 Chart.js-like config 구조에 끌려가지 않게 하는 것이다.

## Contexts

### Public API Facade

사용자가 직접 만지는 영역이다.

Responsibilities:

- `createChart(canvas, config)`
- `chart.append(seriesId, input)`
- `chart.update()`
- `chart.setSeriesVisible(seriesId, visible)`
- `chart.destroy()`
- Chart.js-like config vocabulary 제공

Non-goals:

- Chart.js config 100% compatibility
- plugin compatibility
- renderer internals 노출

### Config Normalization

Chart.js-like config를 내부 도메인 모델로 바꾸는 anti-corruption layer다.

Responsibilities:

- `datasets[]`를 stable `SeriesDescriptor`로 변환
- missing `id` 처리 정책 적용
- `type: "line" | "area"` 검증
- `realtime: true`를 internal realtime mode로 변환

Key rule:

Public config shape는 이 context를 넘어 내부 hot path로 직접 흘러가면 안 된다.

### Input Normalization

append input을 canonical append batch로 바꾼다.

Responsibilities:

- object point input 처리
- tuple point input 처리
- typed-array point input 처리
- `Date`를 epoch milliseconds로 변환
- `null` y를 `NaN` gap sentinel로 변환

### Realtime Storage

series별 columnar buffer를 소유한다.

Responsibilities:

- stable `seriesId`별 `SeriesBuffer` 관리
- `Float64Array` 기반 x/y columns 관리
- ordered fast path invariant 추적
- append-mostly write path 제공

Design decision:

uPlot처럼 columnar 철학을 따른다. 단, 모든 series가 공통 x 배열을 공유하지 않고, 각 series가 자기 x/y columns를 가진다.

### Viewport Query

현재 화면에 보이는 x-range만 계산한다.

Responsibilities:

- time x-range 관리
- ordered x column에 대한 binary search
- visible slice 생성

### Downsampling

visible points를 render points로 줄인다.

Responsibilities:

- `downsample: "auto"` policy 실행
- M4 후보 알고리즘 적용
- MinMax, MinMaxLTTB 비교가 가능한 policy boundary 유지
- gap segment 보존

### Render Scheduler

render timing과 frame budget을 관리한다.

Responsibilities:

- append/update/visibility/resize invalidation 수집
- RAF render pass 예약
- visible/latest work 우선순위 결정
- frame budget 초과 시 다음 frame으로 이월

Public `flush()` API는 제공하지 않는다. render timing은 이 context의 내부 책임이다.

### Canvas Renderer

`RenderFrame`을 Canvas 2D에 그린다.

Responsibilities:

- line path draw
- area fill draw
- gap segment 처리
- visible series만 렌더링

Non-goals:

- public config 해석
- append input 변환
- series storage mutation

### Interaction

사용자 pointer와 legend interaction을 처리한다.

Responsibilities:

- hover tooltip target 계산
- nearest point lookup
- legend display
- legend toggle to `SetSeriesVisibility`

v1에서는 zoom, pan, brush, cross-chart sync를 제외한다.

### Internal Diagnostics

public API에는 노출하지 않지만, 테스트와 benchmark를 위해 내부 이벤트를 모은다.

Responsibilities:

- `InvalidPointDropped`
- `OutOfOrderPointDropped`
- `DownsampleApplied`
- `FrameBudgetExceeded`
- render timing counters

## Dependency Direction

```text
Public API Facade
-> Config Normalization
-> Command Workflow
-> Input Normalization
-> Realtime Storage
-> Viewport Query
-> Downsampling
-> Render Scheduler
-> Canvas Renderer
```

Interaction은 Public API Facade를 우회하지 않고 command workflow로 상태 변경을 보낸다.

```text
Legend Toggle
-> SetSeriesVisibility
-> ChartInvalidated
-> RenderScheduler
```

## Boundary Rules

1. Public config는 `Config Normalization`을 지나면 내부 model로만 존재한다.
2. Renderer는 `DataPoint[]`나 Chart.js-like dataset을 직접 읽지 않는다.
3. Storage는 Canvas를 모른다.
4. Downsampling은 DOM과 Canvas를 모른다.
5. Diagnostics events는 v1 public API에 노출하지 않는다.
6. Compatibility path는 hot path를 오염시키지 않는다.
