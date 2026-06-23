# 이벤트 스토밍: 실시간 Line/Area 차트

## 목적

이 문서는 v1 도메인의 명령, 이벤트, 정책을 고정한다. 목표는 Chart.js처럼 쉽게 시작하지만, 내부는 APM급 realtime line/area chart에 맞춘 성능 파이프라인으로 동작하는 것이다.

## 범위

v1은 realtime time-series line/area chart에 집중한다.

포함:

- `line`과 `area` 차트 타입
- 여러 series
- 실시간 append
- Chart.js와 비슷한 config 형태
- columnar typed-array hot path
- 자동 downsampling
- `requestAnimationFrame` 기반 render scheduling
- hover tooltip
- legend 표시와 series visibility toggle

제외:

- Chart.js drop-in 호환성
- bar, pie, radar, full scatter, mixed chart
- zoom, pan, brush, cross-chart sync
- public plugin 호환성
- public diagnostics 구독 API

## 행위자

- `ChartUser`: 차트를 생성하고 데이터를 넣는 라이브러리 사용자.
- `RealtimeProducer`: 서버, WebSocket, polling, worker 등에서 데이터를 공급하는 주체.
- `ChartFacade`: public API를 제공하는 mutable facade.
- `ChartEngine`: 내부 command/event workflow를 실행하는 엔진.
- `BrowserFrameLoop`: `requestAnimationFrame`으로 draw timing을 제공하는 브라우저.
- `CanvasRenderer`: render frame을 Canvas 2D에 그리는 렌더러.

## 명령

| 명령                        | 출처                            | 의미                                                          |
| --------------------------- | ------------------------------- | ------------------------------------------------------------- |
| `CreateChart`               | `createChart(canvas, config)`   | 차트 인스턴스와 내부 state를 만든다.                          |
| `RegisterSeries`            | initial datasets                | stable `seriesId`를 가진 series를 등록한다.                   |
| `AppendPoints`              | `chart.append(seriesId, input)` | realtime fast/convenience path로 데이터를 추가한다.           |
| `UpdateFromDatasetMutation` | `chart.update()`                | Chart.js-like compatibility path로 변경된 dataset을 반영한다. |
| `SetSeriesVisibility`       | legend toggle / API             | 특정 series를 show/hide한다.                                  |
| `ResizeViewport`            | canvas/container resize         | viewport와 render dimensions를 갱신한다.                      |
| `ResolveTooltipTarget`      | pointer move                    | hover 위치에서 가장 가까운 point를 찾는다.                    |
| `DestroyChart`              | `chart.destroy()`               | scheduler, DOM/event binding, buffers를 정리한다.             |

## 도메인 이벤트

이벤트는 v1 public API에 직접 노출하지 않는다. 내부 workflow 테스트, benchmark, debug logging, future diagnostics API의 기반으로 사용한다.

| 이벤트                    | 의미                                                              |
| ------------------------- | ----------------------------------------------------------------- |
| `ChartCreated`            | chart state와 contexts가 생성되었다.                              |
| `SeriesRegistered`        | stable `seriesId`를 가진 series가 등록되었다.                     |
| `PointsAppendRequested`   | public append call이 내부 command로 들어왔다.                     |
| `AppendInputNormalized`   | object/tuple/typed-array 입력이 내부 append batch로 정규화되었다. |
| `PointsEncoded`           | x/y 값이 numeric column으로 encode되었다.                         |
| `PointsAppended`          | points가 `SeriesBuffer`에 반영되었다.                             |
| `InvalidPointDropped`     | invalid x/y point가 버려졌다.                                     |
| `OutOfOrderPointDropped`  | `ordered: true` 경로에서 역순 point가 버려졌다.                   |
| `ChartInvalidated`        | 다음 render frame이 필요해졌다.                                   |
| `RenderScheduled`         | RAF render pass가 예약되었다.                                     |
| `ViewportResolved`        | 현재 visible x-range와 pixel dimensions가 계산되었다.             |
| `DownsampleApplied`       | visible points가 render points로 축약되었다.                      |
| `RenderFrameProduced`     | renderer가 소비할 frame payload가 만들어졌다.                     |
| `RenderCompleted`         | Canvas draw가 완료되었다.                                         |
| `FrameBudgetExceeded`     | frame budget 안에 모든 작업을 끝내지 못했다.                      |
| `SeriesVisibilityChanged` | series visibility가 바뀌었다.                                     |
| `TooltipTargetResolved`   | hover target이 계산되었다.                                        |
| `ChartDestroyed`          | chart resources가 정리되었다.                                     |

## 정책

### Public API 정책

외부 API는 mutable object facade를 유지한다.

```ts
chart.append("cpu-user", points);
chart.setSeriesVisible("cpu-user", false);
chart.destroy();
```

내부에서는 command/event workflow로 처리한다.

```text
Command
-> validate
-> normalize
-> encode
-> update state
-> emit internal events
-> schedule render
```

### 입력 경로 정책

입력 경로는 세 단계로 구분한다.

| 경로    | 예시                                   | 계약                                 |
| ------- | -------------------------------------- | ------------------------------------ |
| easy    | `[{ x, y }]`                           | 읽기 쉽고 편한 object input          |
| faster  | `[[x, y]]`                             | object allocation을 줄인 tuple input |
| fastest | `{ x: Float64Array, y: Float64Array }` | typed-array hot path                 |

`data.push + update()`는 compatibility path다. APM급 hard performance target은 `typed-array append`에 건다.

### Render Scheduling 정책

`append()`는 즉시 draw하지 않는다. 데이터를 적재하고 chart를 invalidated 상태로 만든 뒤, 내부 `RenderScheduler`가 다음 RAF에서 프레임당 최대 1회 draw한다.

### Downsampling 정책

`realtime: true`에서는 downsampling 기본 모드를 `auto`로 본다. 내부 기본 후보는 M4다. M4는 bucket마다 `first`, `min`, `max`, `last`를 보존해 spike와 line shape을 같이 보존한다.

### Diagnostics 정책

도메인 이벤트는 내부에 남기되 public API에는 노출하지 않는다. 추후 필요하면 `chart.diagnostics.subscribe(...)` 같은 별도 API로 확장한다.
