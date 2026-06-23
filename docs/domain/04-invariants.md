# 불변식: 실시간 Line/Area 차트

## 목적

이 문서는 깨지면 안 되는 도메인 규칙을 정의한다. 구현은 이 불변식을 타입, validation, unit test, performance benchmark로 보호해야 한다.

## 핵심 불변식

### INV-001: 안정적인 Series Identity

모든 internal series는 stable `seriesId`를 가져야 한다.

이유:

- append target
- visibility state
- buffer ownership
- legend state
- render state

모두 `seriesId`를 기준으로 동기화된다. 배열 index는 stable identity가 아니다.

### INV-002: Chart.js와 비슷하지만 Chart.js 호환은 아님

`ChartConfig`는 Chart.js와 비슷한 vocabulary를 사용한다. 하지만 Chart.js drop-in replacement를 목표로 하지 않는다.

이유:

- 성능 중심 내부 모델을 Chart.js config 구조에 종속시키지 않는다.
- unsupported Chart.js plugin/config behavior를 암묵적으로 약속하지 않는다.

### INV-003: Series별 Columnar Storage

각 series는 자기 x/y columns를 가진다.

```ts
SeriesBuffer {
  x: Float64Array
  y: Float64Array
}
```

모든 series가 공통 x 배열을 공유하지 않는다.

이유:

- APM/realtime streams는 series마다 timestamp가 다를 수 있다.
- uPlot식 columnar 철학은 가져오되, storage model은 더 유연하게 유지한다.

### INV-004: 동일한 Column 길이

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

이유:

- viewport query를 binary search로 처리한다.
- downsampling 대상 slice를 빠르게 찾는다.
- append-mostly storage를 단순하게 유지한다.

### INV-006: 역순 입력은 State를 망가뜨리지 않음

`ordered: true`에서 역순 point가 들어와도 `SeriesBuffer`를 깨뜨리면 안 된다.

정책:

- 내부 workflow는 `Result`로 invalid input을 표현한다.
- invalid point는 drop하고 internal event를 남긴다.
- public API는 기본적으로 Result를 노출하지 않는다.

### INV-007: 내부 Time은 숫자임

내부 x는 항상 epoch milliseconds number다.

허용 입력:

- `number`
- `Date`

v1 realtime path에서 제외:

- string date
- category x

### INV-008: 내부 Gap은 NaN임

외부 `y: null`은 내부에서 `NaN`으로 encode한다.

Render 규칙:

- finite y는 line/area path에 포함한다.
- `NaN` y는 gap이다.
- gap을 지나 선을 연결하지 않는다.

### INV-009: Append는 동기적으로 Draw하지 않음

`chart.append(...)`는 데이터를 추가하고 chart를 invalidated로 표시한다. 즉시 Canvas draw를 수행하지 않는다.

실제 draw는 `RenderScheduler`가 다음 `requestAnimationFrame`에서 수행한다.

### INV-010: Public Flush API 없음

v1 public API에는 `flush()`를 제공하지 않는다.

이유:

- render timing을 사용자가 직접 제어하면 edge case가 급격히 늘어난다.
- scheduler, frame budget, invalidation 정책이 public behavior로 굳어진다.

### INV-011: 보이는 작업 우선

Scheduler는 현재 viewport, visible series, 최신 데이터를 우선한다.

Frame budget을 넘기는 작업은 다음 frame으로 이월할 수 있다.

### INV-012: 숨겨진 Series는 Render 작업에서 제외

Hidden series는 render frame과 downsampling 대상에서 제외한다.

Interaction state와 buffer는 유지할 수 있지만, visible rendering work는 수행하지 않는다.

### INV-013: 자동 Downsampling

`realtime: true`에서는 내부 downsampling policy가 `auto`로 동작해야 한다.

기본 알고리즘 후보:

- M4

Benchmark 비교 후보:

- MinMax
- M4
- MinMaxLTTB

### INV-014: Downsampling은 Gap을 보존해야 함

Downsampling은 `NaN` gap을 무시하고 선을 이어버리면 안 된다.

출력 render data는 gap segment를 보존해야 한다.

### INV-015: 성능 보장은 계층화됨

성능 계약은 input path마다 다르다.

| 경로                   | 보장                    |
| ---------------------- | ----------------------- |
| typed-array append     | hard performance target |
| tuple append           | fast convenience target |
| object append          | easy convenience target |
| `data.push + update()` | compatibility target    |

APM급 hard target은 typed-array append에 둔다.

### INV-016: Public Error는 단순하게 유지

Public API는 Result type을 강제하지 않는다.

규칙:

- invalid initial config는 throw할 수 있다.
- streaming 중 일부 invalid point는 chart를 죽이지 않고 drop한다.
- destroy 이후 호출 behavior는 명확히 정의해야 한다.
- 내부 workflow는 `Result`와 internal event로 실패를 표현한다.

### INV-017: Internal Event는 Public API가 아님

`DownsampleApplied`, `FrameBudgetExceeded`, `InvalidPointDropped` 같은 이벤트는 v1에서 internal diagnostics surface다.

Public callback이나 subscription으로 노출하지 않는다. 필요하면 추후 별도 diagnostics API로 추가한다.
