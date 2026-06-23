# 워크플로: 실시간 Line/Area 차트

## 목적

이 문서는 public method가 내부 command/event/render pipeline으로 어떻게 흘러가는지 정의한다.

## 워크플로: 차트 생성

```text
createChart(canvas, config)
-> config 검증
-> Chart.js와 비슷한 config 정규화
-> series descriptor 등록
-> initial dataset input encode
-> series별 SeriesBuffer 초기화
-> viewport와 scheduler 초기화
-> initial render 예약
-> Chart facade 반환
```

규칙:

- invalid chart type은 throw한다.
- v1 chart type은 `"line"` 또는 `"area"`다.
- `realtime: true`는 realtime engine을 활성화한다.
- missing dataset `id`는 stable internal id로 보정할 수 있지만, realtime append path에서는 explicit id를 권장한다.

## 워크플로: Point Append

```text
chart.append(seriesId, input)
-> AppendPoints command
-> seriesId 검증
-> input shape 정규화
-> x/y 값 encode
-> ordered invariant 검증
-> SeriesBuffer에 append
-> PointsAppended 또는 InvalidPointDropped emit
-> chart invalidated 표시
-> 아직 예약되지 않았다면 RAF render 예약
```

입력 형태:

```ts
chart.append("cpu", [{ x, y }]);
chart.append("cpu", [[x, y]]);
chart.append("cpu", { x: Float64Array, y: Float64Array });
```

성능 계층:

- object input: easiest
- tuple input: faster
- typed-array input: fastest and hard performance target

## 워크플로: Compatibility Update

```text
chart.data.datasets[n].data.push(point)
chart.update()
-> UpdateFromDatasetMutation command
-> 변경된 dataset snapshot 감지 또는 재구성
-> compatibility path로 정규화
-> 매칭되는 SeriesBuffer 업데이트
-> chart invalidated 표시
-> RAF render 예약
```

규칙:

- compatibility path는 사용성 때문에 지원한다.
- hard APM performance target은 이 경로에 적용하지 않는다.
- compatibility path가 renderer에게 `DataPoint[]` 소비를 강제하면 안 된다.

## 워크플로: RAF Render Pass

```text
requestAnimationFrame
-> invalidated chart state 수집
-> viewport 계산
-> visible series 선택
-> binary search로 visible slice 조회
-> 필요하면 downsample
-> RenderFrame 생성
-> CanvasRenderer.draw(RenderFrame)
-> RenderCompleted emit
```

Scheduler 우선순위:

1. current viewport
2. visible series
3. latest data
4. interaction lookup data
5. non-visible or deferred work

frame budget을 초과하면:

```text
-> FrameBudgetExceeded emit
-> deferred work를 다음 frame으로 이월
```

## 워크플로: Viewport Query

```text
SeriesBuffer.x
-> xMin binary search
-> xMax binary search
-> VisibleSeriesSlice 생성
```

전제 조건:

- series x column is ordered.

ordered invariant를 사용할 수 없다면 engine은 더 느린 경로를 사용하거나 해당 경로를 hard performance guarantee에서 제외해야 한다.

## 워크플로: Downsample

```text
VisibleSeriesSlice
-> visiblePointCount <= pixelWidth * threshold이면 그대로 사용
-> 아니면 DownsamplePolicy 적용
-> render x/y 배열과 gap segment 생성
```

기본 후보:

```text
M4: bucket마다 first, min, max, last 보존
```

규칙:

- spike preservation is required.
- `NaN` gaps must remain gaps.
- downsampling output must be bounded by screen resolution, not by retained raw data size.

## 워크플로: Hover Tooltip

```text
pointer move
-> ResolveTooltipTarget command
-> pixel x를 time x로 변환
-> visible/raw index에서 nearest point 검색
-> hidden series 무시
-> gap value 무시
-> tooltip state 업데이트
-> 필요하면 lightweight overlay render 예약
```

규칙:

- tooltip lookup must not block main render path.
- nearest point search should use visible/raw index, not only downsampled output, when practical.

## 워크플로: Legend Toggle

```text
legend click
-> SetSeriesVisibility command
-> SeriesDescriptor.visible 업데이트
-> SeriesVisibilityChanged emit
-> chart invalidated 표시
-> RAF render 예약
```

규칙:

- hidden series remains in storage.
- hidden series is excluded from downsample/render work.

## 워크플로: Resize

```text
ResizeObserver or explicit resize
-> ResizeViewport command
-> pixelWidth/pixelHeight 업데이트
-> viewport와 render frame invalidate
-> RAF render 예약
```

## 워크플로: Destroy

```text
chart.destroy()
-> DestroyChart command
-> 예약된 render work 취소
-> event listener 제거
-> reference 해제
-> state destroyed 표시
-> ChartDestroyed emit
```

destroy 이후 public method 동작은 명시적이어야 한다. 선호하는 v1 동작:

- `append`, `update`, `setSeriesVisible` after destroy throw a clear error.
- duplicate `destroy()` is a no-op.
