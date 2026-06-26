# APM 차트 멘탈모델과 용어 풀이

## 문서 역할

이 문서는 APM 차트 도메인을 배우면서 `xel-stack/chart`의 내부 구조를 이해하기 위한 학습 문서다.

목표는 Prometheus 문법을 외우는 것이 아니다. 목표는 다음 질문에 답할 수 있게 되는 것이다.

```text
APM 차트에 들어오는 숫자는 어떤 과정을 거쳐 만들어지는가?
그중 chart core가 책임질 일은 어디부터 어디까지인가?
```

프로젝트 결정 기록은 `20260625_apm_chart_requirements_review.md`를 본다. 이 문서는 그 결정을 이해하기 위한 멘탈모델과 용어 풀이를 제공한다.

## 가장 중요한 멘탈모델

이 문서 전체는 아래 문장 하나를 이해하기 위한 것이다.

```text
Metric processing은 의미를 만든다.
Chart rendering은 의미를 보존한 채 화면 비용을 줄인다.
```

둘을 섞으면 안 된다.

예를 들어:

```promql
rate(http_requests_total[5m])
```

이것은 metric processing이다. 누적 요청 수를 초당 요청 수라는 다른 의미로 바꾼다.

반면:

```text
visible slice
-> M4 downsampling
-> canvas draw
```

이것은 chart rendering이다. 이미 초당 요청 수가 된 series를 화면 픽셀 수에 맞게 줄인다.

M4 downsampling은 요청 수를 초당 요청 수로 바꾸면 안 된다. 이미 정해진 의미를 유지하면서 점 개수만 줄여야 한다.

## 하나의 metric을 끝까지 따라가기

어떤 API 서버가 요청 수를 metric으로 내보낸다고 하자.

```text
http_requests_total
```

이 metric은 “지금까지 처리한 HTTP 요청 총 개수”다.

값은 이렇게 증가할 수 있다.

```text
10
15
21
30
```

처음 보면 이 값을 그대로 line chart로 그리고 싶다. 하지만 그대로 그리면 계속 올라가는 누적선만 보인다.

운영자가 보통 보고 싶은 것은 총 요청 수가 아니라 초당 요청 수다. 그래서 Prometheus에서는 보통 이렇게 가공한다.

```promql
rate(http_requests_total[5m])
```

이제 의미가 바뀐다.

```text
지금까지 총 몇 개
-> 최근 5분 기준 초당 몇 개
```

차트 core가 받아야 하는 값은 보통 raw counter가 아니라 이 가공 결과다.

우리 라이브러리 입장에서는 최종적으로 이런 입력이 들어오는 것이 좋다.

```ts
chart.append("requests-rate", {
  x: new Float64Array([t1, t2, t3]),
  y: new Float64Array([120, 135, 128]),
});
```

여기서 `y`는 이미 초당 요청 수다.

차트 core는 `rate()`를 계산하지 않는다. 차트 core는 이 숫자를 빠르게 저장하고, 현재 화면 구간만 고르고, 필요하면 spike를 보존하면서 downsampling하고, canvas에 그린다.

## Raw metric, dashboard series, render series

`http_requests_total`은 raw metric이다.

`rate(http_requests_total[5m])`의 결과는 dashboard에서 보기 좋은 processed series다.

`visible slice + downsampling` 결과는 실제 화면에 그릴 render series다.

| 구분             | 예시                         | 의미                       | chart core 책임인가   |
| ---------------- | ---------------------------- | -------------------------- | --------------------- |
| raw metric       | `http_requests_total`        | 지금까지 총 요청 수        | 아니다                |
| processed series | `rate(...[5m])`              | 초당 요청 수               | 입력으로 받을 수 있음 |
| render series    | visible slice + downsampling | 화면에 그릴 점으로 줄인 것 | 맞다                  |

우리 v1 core는 마지막 영역을 책임진다.

```text
이미 의미가 정해진 series를 빠르게 그리고 줄이는 것
```

Prometheus adapter나 backend는 앞 영역을 책임질 수 있다.

```text
raw metric을 dashboard series로 바꾸는 것
```

## 수집 주기와 렌더 주기

APM 데이터를 처음 보면 “실시간”이라는 말 때문에 16ms마다 데이터가 들어와야 할 것처럼 느껴질 수 있다.

하지만 Prometheus식 metric은 보통 scrape interval을 가진다.

```text
5초마다 수집
10초마다 수집
15초마다 수집
30초마다 수집
```

중요한 점:

```text
수집 주기와 렌더 주기는 다르다.
```

차트는 16ms마다 새 데이터를 만들어내는 엔진이 아니다. 차트는 데이터가 들어왔을 때 상태를 갱신하고, 렌더는 RAF로 합친다.

```text
append 100번
-> dirty 1번
-> RAF render 1번
```

이것이 APM dashboard burst 상황에 맞는 모델이다.

## Metric identity와 chart series

Prometheus에서 하나의 time series는 다음으로 결정된다.

```text
metric name + label set
```

예:

```text
http_requests_total{method="GET", status="200"}
http_requests_total{method="POST", status="200"}
http_requests_total{method="GET", status="500"}
```

이 세 개는 모두 다른 time series다. 차트에서는 각각이 하나의 series가 될 수 있다.

문제는 label 값이 너무 많을 때다.

```text
http_requests_total{user_id="1"}
http_requests_total{user_id="2"}
http_requests_total{user_id="3"}
...
```

`user_id`가 100만 개면 series도 100만 개까지 늘 수 있다.

쉬운 말로:

```text
label 하나는 공짜가 아니다.
label 조합 하나가 chart series 하나가 될 수 있다.
```

차트 관점에서는 이렇게 이어진다.

```text
label cardinality 증가
-> series 증가
-> legend 증가
-> tooltip lookup 증가
-> downsampling 대상 증가
-> renderer 작업 증가
-> dashboard 느려짐
```

이 때문에 후속 기능으로 top-N series, visible series 우선 처리, hidden series skip, legend virtualization, series count diagnostics가 필요해질 수 있다.

## 0, missing, stale, NaN gap

차트에서 비어 보이는 구간을 모두 0으로 처리하면 안 된다.

| 상태      | 의미                           | 차트에서의 직관               |
| --------- | ------------------------------ | ----------------------------- |
| `0`       | 실제 값이 0이다                | 선이 0으로 내려간다.          |
| missing   | 그 시점의 sample이 없다        | 선을 끊거나 빈 구간으로 둔다. |
| stale     | series가 더 이상 최신이 아니다 | 선을 끊거나 상태를 표시한다.  |
| `NaN` gap | chart 내부에서 끊김을 표현한다 | line/area path를 끊는 신호다. |

예를 들어 CPU 사용률이 0인 것과, 서버가 사라져서 값이 안 들어오는 것은 완전히 다르다.

우리 프로젝트에서 이미 정한 정책:

```text
외부 y: null
-> 내부 y: NaN
-> renderer는 선을 끊는다.
```

후속 Prometheus adapter는 missing/stale sample을 내부 `NaN` gap 또는 series state로 바꿔야 한다.

## Counter, Gauge, Histogram

Metric type은 차트에 들어가기 전 가공 방식을 결정한다.

### Counter

Counter는 계속 증가하는 누적값이다.

예:

```text
http_requests_total
process_cpu_seconds_total
```

대시보드에서는 보통 raw counter를 그대로 그리지 않는다. 대부분은 변화율로 바꾼다.

```promql
rate(http_requests_total[5m])
```

멘탈모델:

```text
Counter = 지금까지 총 몇 번
Rate(counter) = 지금 얼마나 자주 일어나는가
```

### Gauge

Gauge는 현재 상태값이다. 오를 수도 있고 내려갈 수도 있다.

예:

```text
memory_usage_bytes
queue_size
in_progress_requests
```

Gauge는 line/area chart에 바로 들어가기 쉽다.

멘탈모델:

```text
Gauge = 온도계 같은 값
```

### Histogram

Histogram은 latency나 response size 같은 분포를 bucket으로 나눠 저장한다.

예:

```text
http_request_duration_seconds_bucket{le="0.1"}
http_request_duration_seconds_bucket{le="0.5"}
http_request_duration_seconds_bucket{le="+Inf"}
http_request_duration_seconds_sum
http_request_duration_seconds_count
```

Histogram은 단순한 선 하나보다 percentile band, latency heatmap, histogram snapshot과 더 잘 맞는다.

멘탈모델:

```text
Histogram = 한 줄 값이 아니라 분포 재료
```

따라서 histogram/heatmap/percentile 지원은 v1 line/area 이후 별도 milestone으로 본다.

## Percentile은 평균내면 안 된다

APM에서 p95, p99는 자주 나온다.

처음에는 이런 생각을 하기 쉽다.

```text
server A p95 = 100ms
server B p95 = 300ms
평균 p95 = 200ms
```

이건 위험하다.

이미 계산된 percentile은 여러 서버에 대해 단순 평균해도 전체 p95가 되지 않는다.

올바른 방향은:

```text
분포 데이터(histogram bucket 등)를 합친 뒤 percentile을 다시 계산한다.
```

이건 renderer 성능 문제가 아니라 데이터 의미 문제다. v1 chart core는 p95의 수학적 정합성을 책임지지 않는다.

## Aggregation과 Downsampling

이 둘은 반드시 분리해서 생각해야 한다.

### Aggregation

Aggregation은 여러 series나 sample을 의미 있게 합치는 것이다.

예:

```promql
sum without (instance) (rate(http_requests_total[5m]))
```

이건 instance별 요청 수를 service-level 요청 수로 만든다. 의미가 바뀐다.

### Downsampling

Downsampling은 화면에 그릴 점 수를 줄이는 것이다.

예:

```text
1,000,000 visible points
-> 1,000px 화면에 맞게 M4로 줄임
```

의미가 바뀌면 안 된다.

멘탈모델:

```text
Aggregation은 데이터를 해석한다.
Downsampling은 데이터를 그릴 수 있게 압축한다.
```

우리 라이브러리의 core는 downsampling을 책임진다. PromQL/backend/adapter는 aggregation을 책임진다.

## APM 차트 용어 풀이

### APM

Application Performance Monitoring의 줄임말이다.

쉽게 말하면 서비스의 CPU, latency, error, request rate, trace 같은 운영 상태를 보는 도구다.

APM 차트는 예쁜 그래프보다 다음이 중요하다.

- 장애 spike를 숨기지 않기
- 데이터가 몰려도 화면 멈추지 않기
- 여러 차트가 동시에 갱신돼도 버티기
- 현재값을 정확하게 보여주기

### hard path

성능을 진짜로 책임지는 경로다.

우리 프로젝트에서는 이것이다.

```ts
chart.append("cpu", {
  x: new Float64Array([t1, t2, t3]),
  y: new Float64Array([42, NaN, 44]),
});
```

쉽게 말하면:

```text
우리 라이브러리가 "빠르다"고 주장할 때 기준으로 삼는 공식 고속도로
```

object 배열도 지원하지만, 최고 성능 보장 대상은 아니다.

### convenience path

쓰기 쉬운 경로다.

예:

```ts
chart.append("cpu", [{ x: Date.now(), y: 42 }]);
chart.append("cpu", [[Date.now(), 42]]);
```

이 경로는 사용자에게 편하지만 내부에서 숫자 배열로 바꾸는 비용이 있다.

### typed-array

JavaScript의 숫자 전용 배열이다.

예:

```ts
new Float64Array([1, 2, 3]);
```

일반 배열보다 성능 예측이 쉽고, 숫자 데이터를 많이 다룰 때 유리하다.

### columnar

점 하나씩 묶어 저장하지 않고, x와 y를 따로 저장하는 방식이다.

object 방식:

```ts
[
  { x: 1000, y: 1 },
  { x: 2000, y: 2 },
];
```

columnar 방식:

```ts
{
  x: new Float64Array([1000, 2000]),
  y: new Float64Array([1, 2]),
}
```

대용량 차트에서는 columnar 방식이 더 유리하다.

### append

기존 데이터 뒤에 새 데이터를 붙이는 일이다.

APM에서는 데이터가 계속 들어오므로 append가 핵심 동작이다.

### Series

차트에 그려지는 하나의 선 또는 면이다.

예:

- CPU user
- CPU system
- memory used
- request latency p95

각 series는 자기 x/y buffer를 가진다.

### SeriesBuffer

하나의 series 데이터를 저장하는 내부 저장소다.

쉽게 말하면:

```text
CPU user 선을 그리기 위한 시간 배열과 값 배열
```

대략 이런 모양이다.

```ts
{
  x: Float64Array;
  y: Float64Array;
  length: number;
}
```

### ring buffer

용량이 정해진 원형 저장소다.

가득 찬 상태에서 새 데이터가 들어오면 가장 오래된 데이터를 밀어낸다.

쉽게 말하면:

```text
최근 10분만 보관하는 회전 저장소
```

지금 당장 구현하지는 않지만, `SeriesBuffer`가 나중에 이 구조로 바뀔 수 있어야 한다.

### visible slice

전체 데이터 중 현재 화면에 보이는 구간이다.

예:

```text
전체 데이터: 오전 9시 ~ 오후 6시
현재 화면: 오후 1시 ~ 오후 1시 5분
visible slice: 오후 1시 ~ 오후 1시 5분 데이터만
```

대용량 성능의 핵심은 전체 데이터를 매번 보지 않는 것이다.

### binary search

정렬된 배열에서 원하는 위치를 빠르게 찾는 방법이다.

시간 x가 정렬되어 있으면 현재 viewport의 시작/끝 index를 빠르게 찾을 수 있다.

그래서 `ordered: true`가 성능에 중요하다.

### downsampling

데이터가 너무 많을 때, 화면에 그릴 점을 줄이는 과정이다.

예:

```text
화면 폭: 1000px
보이는 점: 1,000,000개
```

이때 1,000,000개를 모두 그려도 사람 눈에는 구분되지 않는다. 그래서 픽셀 수에 맞게 줄인다.

중요한 점:

```text
그냥 평균내면 안 된다.
장애 spike가 사라질 수 있다.
```

### M4

Downsampling 방법 중 하나다.

각 구간마다 다음을 남긴다.

```text
first: 처음 점
min: 가장 낮은 점
max: 가장 높은 점
last: 마지막 점
```

쉽게 말하면:

```text
많은 점을 줄이되, 튀는 값과 구간 모양을 최대한 살리는 방법
```

### spike

순간적으로 값이 튀는 현상이다.

APM에서는 spike가 장애 신호일 수 있다.

Downsampling이 spike를 지우면 차트가 거짓말을 하게 된다.

### gap

데이터가 없는 구간이다.

우리 프로젝트는 gap을 내부에서 `NaN`으로 표현한다.

```ts
y: new Float64Array([10, NaN, 12]);
```

gap에서는 선을 이어 그리면 안 된다. 선을 이어버리면 없던 데이터를 만들어낸 것처럼 보인다.

### RAF

`requestAnimationFrame`의 줄임말이다.

브라우저가 다음 화면 그리기 타이밍에 함수를 실행하게 해준다.

우리 프로젝트에서는 append가 일어날 때마다 즉시 그리지 않는다.

### coalescing

여러 일을 하나로 합치는 것이다.

차트에서는 여러 append/update를 한 번의 render로 합친다는 뜻이다.

쉽게 말하면:

```text
새로 그려달라는 요청이 100번 와도 실제 그림은 1번만 그린다.
```

### frame budget

한 frame 안에서 쓸 수 있는 시간 예산이다.

60fps 기준으로 한 frame은 약 16.67ms다.

하지만 APM 차트에서 이 말은 16ms마다 데이터를 수집하라는 뜻이 아니다.

우리에게는:

```text
그릴 일이 생겼을 때 너무 오래 main thread를 막지 말자는 예산
```

### retention

데이터를 얼마나 오래 보관할지에 대한 정책이다.

예:

```text
최근 5분만 보관
최근 100만 점만 보관
무제한 보관
```

현재 v1 public API에는 강제 retention을 넣지 않는다. 다만 나중에 넣을 수 있게 내부 구조를 망치지 않아야 한다.

### wire format

네트워크로 데이터가 들어오는 형식이다.

예:

- JSON
- binary
- 압축 binary
- typed-array buffer

중요한 이유:

```text
10MB/s라고 해도 JSON 10MB와 typed-array 10MB는 처리 비용이 완전히 다르다.
```

현재 v1은 chart library의 append API를 다루고, wire format은 후속 과제로 둔다.

### Worker

브라우저에서 main thread 밖에서 일을 처리하는 별도 실행 공간이다.

무거운 파싱, decimation, 계산을 Worker로 보내면 UI 멈춤을 줄일 수 있다.

지금 당장 구현하지는 않는다. 하지만 나중에 옮길 수 있게 경계를 잘 나눠야 한다.

### OffscreenCanvas

Worker에서도 canvas에 그릴 수 있게 해주는 브라우저 기능이다.

고성능 렌더링에 도움이 될 수 있지만, 현재 v1 시작점은 아니다.

### SharedArrayBuffer

main thread와 Worker가 같은 메모리를 공유할 수 있게 해주는 기능이다.

대용량 데이터 복사를 줄이는 데 유리하지만, 배포 환경 제약이 있다.

지금은 후속 조사 대상으로 둔다.

### cardinality

series가 얼마나 많이 생기는지를 말한다.

예:

```text
host 1000개
endpoint 100개
status 5개
```

조합하면 series가 폭발할 수 있다.

line/area v1에서는 모든 cardinality 문제를 해결하지 않는다. 하지만 legend/render/scheduler가 visible series 중심으로 동작해야 한다.

### percentile

상위 몇 퍼센트 지점을 보는 값이다.

예:

```text
p95 latency = 요청 100개 중 95번째로 느린 요청의 latency
```

APM에서는 평균보다 percentile이 중요할 때가 많다.

하지만 percentile은 단순 평균하면 안 된다. 이 문제는 v1 line/area 이후 별도 milestone에서 다룬다.

### heatmap

값의 분포를 색으로 보여주는 차트다.

latency처럼 분포가 중요한 데이터에 유용하다.

현재 v1 범위는 아니다.

### sketch

많은 데이터를 작게 요약해서 percentile 같은 값을 추정할 수 있게 하는 자료구조다.

예:

- DDSketch
- HdrHistogram
- t-digest

현재 v1에는 넣지 않는다. 나중에 latency/heatmap milestone에서 검토한다.

### coordinated omission

느린 구간의 데이터를 측정 과정에서 빠뜨려서 시스템이 실제보다 좋아 보이는 문제다.

차트 관점에서는 다음과 연결된다.

```text
데이터가 너무 많다고 아무 점이나 버리면,
가장 중요한 느린 구간이나 spike를 숨길 수 있다.
```

그래서 downsampling은 평균/무작위 drop보다 spike 보존이 중요하다.

## Recording Rule과 Alerting Rule

Recording rule은 비싼 PromQL 결과를 미리 계산해서 새 time series로 저장하는 기능이다.

쉽게 말하면:

```text
Prometheus식 사전 계산 캐시
```

APM dashboard에서 매번 브라우저가 모든 raw series를 받아서 합치고 계산하면, 차트 renderer가 아무리 빨라도 전체 경험은 느려진다.

좋은 방향:

```text
Prometheus / backend / recording rule에서 의미 있는 집계를 끝낸다.
chart core는 이미 가공된 series를 빠르게 그린다.
```

Alerting rule은 chart input 그 자체는 아니다. 하지만 alert marker, deploy marker, incident marker, anomaly band 같은 후속 overlay는 line data와 다른 data model일 수 있다.

## `task_m001_004`와 연결

지금 우리는 Prometheus adapter를 만들지 않는다.

하지만 이 멘탈모델은 `task_m001_004 input normalization boundary`에 바로 영향을 준다.

```text
metric processing이 끝난 series를
chart core의 numeric hot path로 넘기는 입구
```

즉 이번 task에서 여는 경계는 다음이다.

```text
PointObject[] / PointTuple[] / ColumnarPointBatch
-> numeric x column
-> numeric y column
-> length
-> gap = NaN
```

이번 task에서 하지 않는 일:

- PromQL parsing
- Prometheus HTTP API 호출
- counter를 rate로 변환
- histogram percentile 계산
- recording rule 관리
- alerting rule 관리
- label cardinality를 backend에서 줄이는 일

이 구분이 선명해야 `chart core`가 작고 빠르게 남는다.

## 우리 라이브러리의 책임 경계

현재 v1 chart core가 책임질 것:

- 쉬운 입력을 받는다.
- 내부 숫자 column으로 encode한다.
- series-local buffer에 저장한다.
- 현재 viewport의 visible slice를 고른다.
- 화면 픽셀 수에 맞게 downsampling한다.
- `NaN` gap을 보존한다.
- RAF로 render를 합친다.

현재 v1 chart core가 책임지지 않을 것:

- metric이 counter인지 gauge인지 자동 판단
- raw counter를 rate로 변환
- Prometheus query 실행
- label cardinality 줄이기
- histogram에서 percentile 계산
- alert rule 평가

후속 adapter/middleware가 책임질 수 있는 것:

- Prometheus range query result를 `ColumnarPointBatch`로 변환
- metric name, labels, unit, metric type metadata 보존
- counter/gauge/histogram/summary별 chart input policy 결정
- missing/stale sample을 `NaN` gap 또는 series state로 encode
- high-cardinality 결과에 top-N/limit/other 정책 적용

## 앞으로 읽을 때 잡아야 할 기준

Prometheus나 APM 문서를 읽을 때 다음 질문을 계속 던지면 된다.

1. 이 개념은 데이터를 수집하는 이야기인가?
2. 이 개념은 series identity와 cardinality를 관리하는 이야기인가?
3. 이 개념은 raw metric을 dashboard series로 가공하는 이야기인가?
4. 이 개념은 이미 가공된 series를 화면에 그리는 이야기인가?
5. 이 책임은 chart core가 가져야 하는가, adapter/backend가 가져야 하는가?

이 질문에 답할 수 있으면 멘탈모델이 잡히기 시작한 것이다.

## 기억할 문장

```text
차트에 들어오는 숫자는 그냥 숫자가 아니다.
이미 수집/분류/가공의 결과다.
```

```text
Metric processing은 의미를 바꾼다.
Chart rendering은 의미를 유지하며 화면 비용을 줄인다.
```

```text
Counter는 rate로 보고,
Gauge는 현재값으로 보고,
Histogram은 분포로 봐야 한다.
```

```text
Label 조합 하나는 chart series 하나가 될 수 있다.
Cardinality 문제는 storage 문제이면서 UI/render 문제다.
```

```text
대용량 성능은 한 번에 생기지 않는다.
입력 경계에서 object world와 numeric column world를 분리하는 순간부터 시작된다.
```

## 근거

- Prometheus overview: https://prometheus.io/docs/introduction/overview/
- Prometheus data model: https://prometheus.io/docs/concepts/data_model/
- Prometheus metric types: https://prometheus.io/docs/concepts/metric_types/
- Prometheus metric and label naming: https://prometheus.io/docs/practices/naming/
- Prometheus instrumentation best practices: https://prometheus.io/docs/practices/instrumentation/
- Prometheus configuration and relabeling: https://prometheus.io/docs/prometheus/latest/configuration/configuration/
- Prometheus querying basics: https://prometheus.io/docs/prometheus/latest/querying/basics/
- Prometheus histograms and summaries: https://prometheus.io/docs/practices/histograms/
- Prometheus native histograms: https://prometheus.io/docs/specs/native_histograms/
- Prometheus recording rule naming: https://prometheus.io/docs/practices/rules/
- Prometheus recording rules config: https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/
- Prometheus alerting practices: https://prometheus.io/docs/practices/alerting/
- Prometheus alerting rules config: https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/
- Prometheus rule unit testing: https://prometheus.io/docs/prometheus/latest/configuration/unit_testing_rules/
- Prometheus remote write 1.0: https://prometheus.io/docs/specs/prw/remote_write_spec/
- Prometheus remote write 2.0: https://prometheus.io/docs/specs/prw/remote_write_spec_2_0/
- OpenMetrics 1.0: https://prometheus.io/docs/specs/om/open_metrics_spec/

## 다시 볼 시점

- `task_m001_004` 수행계획서를 작성할 때
- Prometheus adapter를 논의할 때
- chart input metadata 확장을 결정할 때
- histogram/heatmap milestone을 시작할 때
- dashboard benchmark에서 series cardinality 문제가 보일 때
- recording rule과 client-side downsampling의 역할을 나눌 때
