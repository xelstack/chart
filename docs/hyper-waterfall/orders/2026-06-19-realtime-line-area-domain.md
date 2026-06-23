# Hyper-Waterfall 작업 지시서: Realtime Line/Area 도메인

## 지시

Chart.js처럼 사용하기 쉽지만 성능을 우선하는 realtime line/area chart library의 도메인 모델을 정의한다.

## 날짜

2026-06-19

## 목표

추가 구현 전에 안정적인 도메인 기반을 만든다. 라이브러리는 시작하기 쉬워야 하며, 동시에 APM급 realtime chart workload를 향해 최적화할 수 있는 별도 typed-array hot path를 보존해야 한다.

## 제품 목표

```text
Chart.js와 비슷한 사용성
+ 극도로 최적화된 realtime 성능
+ line/area time-series 집중
```

## 승인된 도메인 결정

1. 외부 API는 Chart 중심이며 Chart.js와 비슷한 형태다.
2. Chart.js drop-in 호환성은 목표가 아니다.
3. v1은 realtime time-series `line`과 `area`에 집중한다.
4. x scale은 time이고 y scale은 linear다.
5. `Series`는 하나의 line/area time series를 나타내는 내부 단위다.
6. 모든 series는 안정적인 `seriesId`를 가진다.
7. 내부 storage는 series-local columnar x/y buffer를 사용한다.
8. x input은 `number | Date`를 받으며 내부 x는 epoch milliseconds다.
9. y input은 `number | null`을 받으며 내부 gap sentinel은 `NaN`이다.
10. `realtime: true`는 단순한 public entry point다.
11. `append`는 realtime canonical path다.
12. object, tuple, typed-array append input을 지원한다.
13. typed-array append는 hard performance path다.
14. dataset mutation + `update()`는 compatibility path다.
15. append는 동기적으로 draw하지 않는다.
16. render timing은 내부 RAF scheduler가 소유한다.
17. public `flush()`는 제외한다.
18. scheduler는 frame budget 안에서 visible/latest work를 우선한다.
19. downsampling은 auto를 기본으로 하며, 내부 기본 후보는 M4다.
20. hover tooltip과 legend toggle은 v1 interaction이다.
21. zoom/pan과 public diagnostics API는 뒤로 미룬다.
22. public API는 mutable facade이고, 내부 domain은 command/event workflow를 사용한다.
23. internal workflow는 Result-style validation을 사용한다.
24. internal event는 v1 public API가 아니다.

## 기존 성능 계획과의 관계

`docs/superpowers/plans/2026-06-18-realtime-performance.md`는 성능 작업 목록과 benchmark baseline으로 계속 유효하다. 다만 이 작업 지시서는 `windowMode`, 기본 sliding capacity, `maxPoints`, `maxBytes`를 v1 사용자-facing 계약에 반드시 노출하거나 강제해야 한다는 이전 public API 가정보다 우선한다.

구현 계획은 bounded/visible rendering이라는 성능 의도를 보존해야 한다. 하지만 public v1 API는 `realtime: true`, ordered append, automatic downsampling, internal scheduler behavior에서 시작한다.

## 산출물

도메인 문서:

- `docs/domain/01-event-storming.md`
- `docs/domain/02-context-map.md`
- `docs/domain/03-domain-model.md`
- `docs/domain/04-invariants.md`
- `docs/domain/05-workflows.md`
- `docs/domain/06-api-contract.md`

작업 지시서:

- `docs/hyper-waterfall/orders/2026-06-19-realtime-line-area-domain.md`

## 큰 Waterfall 단계

### 단계 1: 도메인 기반

상태: 현재 지시.

출력:

- event storming
- context map
- domain model
- invariants
- workflows
- API contract

게이트:

- no unresolved open items
- no contradiction between API and internal model
- v1 scope is explicit
- performance hot path is explicit

### 단계 2: 구현계획

입력:

- accepted domain docs
- existing realtime performance plan

출력:

- task-by-task implementation plan
- test gates
- benchmark gates
- migration path from existing streaming code

### 단계 3: 엔진 구현

초점:

- command workflow
- append normalization
- series-local columnar storage
- viewport query
- M4 downsampling
- RAF scheduler
- line/area render frame

### 단계 4: Public API 안정화

초점:

- `createChart`
- `append`
- `update`
- `setSeriesVisible`
- `destroy`
- examples and docs

### 단계 5: 성능 보정

초점:

- typed-array append benchmark
- tuple/object append benchmark
- M4 vs MinMax vs MinMaxLTTB comparison
- real-browser frame timing
- visual regression for gap and spike preservation

## 작은 반복 Loop

모든 구현 task는 다음 loop를 따른다.

```text
명세 slice
-> 실패하는 unit 또는 performance test
-> 최소 구현
-> typecheck
-> focused test
-> 필요할 때 benchmark
-> 결과 문서화
```

## 품질 게이트

- TypeScript typecheck가 통과한다.
- 변경 slice의 unit test가 통과한다.
- 성능 민감 변경에서는 real-browser performance test를 실행한다.
- Renderer는 public `DataPoint[]`를 hot path로 소비하지 않는다.
- `append`는 render를 예약하지만 동기적으로 draw하지 않는다.
- invalid input은 `SeriesBuffer`를 망가뜨릴 수 없다.
- gap semantics는 downsampling과 rendering을 거치며 보존된다.

## 즉시 다음 단계

도메인 문서 리뷰 후, 이 도메인 결정을 기존 `packages/chart-core` codebase에 매핑하는 구현계획서를 작성한다.
