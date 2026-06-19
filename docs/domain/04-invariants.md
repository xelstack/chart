# Invariants: Realtime Line/Area Chart

## Purpose

이 문서는 깨지면 안 되는 도메인 규칙을 정의한다. 구현은 이 불변식을 타입, validation, unit test, performance benchmark로 보호해야 한다.

## Core Invariants

### INV-001: Stable Series Identity

모든 internal series는 stable `seriesId`를 가져야 한다.

Reason:

- append target
- visibility state
- buffer ownership
- legend state
- render state

모두 `seriesId`를 기준으로 동기화된다. 배열 index는 stable identity가 아니다.

### INV-002: Chart.js-Like, Not Chart.js-Compatible

`ChartConfig`는 Chart.js와 비슷한 vocabulary를 사용한다. 하지만 Chart.js drop-in replacement를 목표로 하지 않는다.

Reason:

- 성능 중심 내부 모델을 Chart.js config 구조에 종속시키지 않는다.
- unsupported Chart.js plugin/config behavior를 암묵적으로 약속하지 않는다.

### INV-003: Series-Local Columnar Storage

각 series는 자기 x/y columns를 가진다.

```ts
SeriesBuffer {
  x: Float64Array
  y: Float64Array
}
```

모든 series가 공통 x 배열을 공유하지 않는다.

Reason:

- APM/realtime streams는 series마다 timestamp가 다를 수 있다.
- uPlot식 columnar 철학은 가져오되, storage model은 더 유연하게 유지한다.

### INV-004: Equal Column Length

같은 `SeriesBuffer` 안에서 `x.length`, `y.length`, logical `length`는 일관되어야 한다.

```text
0 <= length <= x.length
0 <= length <= y.length
```

Append가 일부만 성공해서 x/y length가 어긋나면 안 된다.

### INV-005: Ordered Fast Path

`realtime.ordered`의 기본값은 `true`다.

같은 series 안에서 appended x는 non-decreasing이어야 한다.

```text
next.x >= previous.x
```

Reason:

- viewport query를 binary search로 처리한다.
- downsampling 대상 slice를 빠르게 찾는다.
- append-mostly storage를 단순하게 유지한다.

### INV-006: Out-Of-Order Input Does Not Corrupt State

`ordered: true`에서 역순 point가 들어와도 `SeriesBuffer`를 깨뜨리면 안 된다.

Policy:

- 내부 workflow는 `Result`로 invalid input을 표현한다.
- invalid point는 drop하고 internal event를 남긴다.
- public API는 기본적으로 Result를 노출하지 않는다.

### INV-007: Time Is Numeric Internally

내부 x는 항상 epoch milliseconds number다.

Allowed input:

- `number`
- `Date`

Excluded from v1 realtime path:

- string date
- category x

### INV-008: Gap Is NaN Internally

외부 `y: null`은 내부에서 `NaN`으로 encode한다.

Render rule:

- finite y는 line/area path에 포함한다.
- `NaN` y는 gap이다.
- gap을 지나 선을 연결하지 않는다.

### INV-009: Append Does Not Draw Synchronously

`chart.append(...)`는 데이터를 추가하고 chart를 invalidated로 표시한다. 즉시 Canvas draw를 수행하지 않는다.

Actual draw는 `RenderScheduler`가 다음 `requestAnimationFrame`에서 수행한다.

### INV-010: No Public Flush API

v1 public API에는 `flush()`를 제공하지 않는다.

Reason:

- render timing을 사용자가 직접 제어하면 edge case가 급격히 늘어난다.
- scheduler, frame budget, invalidation 정책이 public behavior로 굳어진다.

### INV-011: Visible Work First

Scheduler는 현재 viewport, visible series, 최신 데이터를 우선한다.

Frame budget을 넘기는 작업은 다음 frame으로 이월할 수 있다.

### INV-012: Hidden Series Are Excluded From Render Work

Hidden series는 render frame과 downsampling 대상에서 제외한다.

Interaction state와 buffer는 유지할 수 있지만, visible rendering work는 수행하지 않는다.

### INV-013: Automatic Downsampling

`realtime: true`에서는 내부 downsampling policy가 `auto`로 동작해야 한다.

Default algorithm candidate:

- M4

Benchmark comparison candidates:

- MinMax
- M4
- MinMaxLTTB

### INV-014: Downsampling Must Preserve Gaps

Downsampling은 `NaN` gap을 무시하고 선을 이어버리면 안 된다.

Output render data는 gap segment를 보존해야 한다.

### INV-015: Performance Guarantees Are Tiered

성능 계약은 input path마다 다르다.

| Path | Guarantee |
| --- | --- |
| typed-array append | hard performance target |
| tuple append | fast convenience target |
| object append | easy convenience target |
| `data.push + update()` | compatibility target |

APM급 hard target은 typed-array append에 둔다.

### INV-016: Public Errors Stay Simple

Public API는 Result type을 강제하지 않는다.

Rules:

- invalid initial config는 throw할 수 있다.
- streaming 중 일부 invalid point는 chart를 죽이지 않고 drop한다.
- destroy 이후 호출 behavior는 명확히 정의해야 한다.
- 내부 workflow는 `Result`와 internal event로 실패를 표현한다.

### INV-017: Internal Events Are Not Public API

`DownsampleApplied`, `FrameBudgetExceeded`, `InvalidPointDropped` 같은 이벤트는 v1에서 internal diagnostics surface다.

Public callback이나 subscription으로 노출하지 않는다. 필요하면 추후 별도 diagnostics API로 추가한다.
