# 구현 계획 — 10MB/s @ 60fps 실시간 렌더 (+ 문서·FP P0)

작성 2026-06-17 · 근거: 현재 소스 재확인 완료. **이 문서는 계획만. 코드 미작성.**
관련: `AUDIT-2026-06-17.md` (전체 감사).

---

## 0. 핵심 설계 결정 (먼저 합의할 것)

현재 아키텍처가 목표를 못 맞추는 근본 이유는 **"누적 전체 데이터셋을 매 프레임 전부 다시 그린다"**는 모델 자체입니다. 코드로 확인한 사실:

- `onFrameRender`(`incremental-renderer.ts:85-109`)가 매 프레임 `dataBuffer.flush()` + `[...dataBuffer.getCurrent()]`(2× O(N) 복사) + `calculateViewportFromDataset(전체)`(O(N) 재스캔, **매번 전체 rescale**) + `renderToCanvas(전체)` full redraw.
- `data-buffer.ts`: `current: DataPoint[]`, `flush()`가 `current = [...current, ...pending]`(O(N)), `getCurrent()`도 spread(O(N)).
- `maxPoints` 기본 `undefined`(`incremental-renderer.ts:64`) → 버퍼 무한 증가.
- `virtualization.ts:63-79`: 매 호출 O(N) 선형 스캔 + 인덱스 배열 alloc; 초과 시 blind stride(피크 소실).
- `DataPoint`는 이종 객체 `{x:number|string|Date, y, series?, label?, metadata?}`(`types/index.ts:23-34`) → AoS, 포인트당 80-120B.

**전환 방향 (목표 달성의 전제):**
1. **poll-rate와 frame-rate 분리.** 데이터는 초당 1회 들어오지만, 그리기는 rAF가 주도. 프레임당 비용은 들어온 데이터 양이 아니라 **화면 픽셀 수**에 비례해야 함.
2. **bounded sliding window.** "전체 누적"이 아니라 최근 N(픽셀폭 기반 상한)만 유지. 스트리밍 차트는 sliding x-window가 정상.
3. **per-poll 1회 다운샘플 → per-frame은 ~픽셀수만 그림.**

> ⚠️ 이 3가지에 동의해야 아래 Phase가 의미 있음. 특히 "전체 rescale 유지 vs sliding window"는 **시각적 동작이 바뀌는 결정** — 확인 필요(아래 Open Decisions Q1).

---

## 0.5 코덱스 2차 리뷰 반영 (우선순위 재조정)

코덱스 리뷰(2026-06-17)가 큰 방향엔 동의하되 **핵심 우선순위를 바로잡음**. 아래가 최종 합의 순서이며, Phase 1-6의 상세 내용은 유효하되 **순서와 강조점**이 바뀜:

- **최우선은 typed-array 저장이 아니라 "렌더 입력을 누적 `DataPoint[]`에서 분리"하는 것.** 현재 `onFrameRender`가 `Dataset.points: DataPoint[]`를 매 프레임 재구성해 렌더하므로(`incremental-renderer.ts:91`), 버퍼만 SoA로 바꿔도 렌더 경로가 다시 `DataPoint[]`를 만들면 병목이 그대로. → **columnar hot-path 타입(`ColumnarDatasetView`/`RenderableSeriesView`)을 1급으로 만들고 `DataPoint[]`는 cold snapshot(호버/툴팁/외부 API)으로 격리**가 Phase 1의 진짜 목표.
- **증분 렌더는 기존 `renderIncrementalToCanvas` "재사용"이 아니라 신규 작성.** 그 함수는 `newPoints`만으로 시리즈/카테고리 맵을 만들고 직전 마지막 점과 선을 못 이음(`canvas-render.ts:327`, `line.ts:118`). 재사용은 위험 → 새 incremental renderer로.
- **cull + per-series 다운샘플을 Worker보다 먼저.** Worker는 그래도 부족할 때만. 다운샘플 전에 sorted-x 이분탐색 cull을 둬서 스캔 대상을 visible로 먼저 줄임.
- **sliding window의 min/max는 O(1)이 아님.** 오래된 극값이 링에서 빠지면 재계산 필요 → **monotonic deque 또는 bucket aggregate**. accumulate 모드도 매번 전체 스캔하면 O(total) → **appendable min/max bucket/pyramid** 유지.

**재조정된 순서:** Phase 0(실브라우저 벤치) → Phase 1(columnar 타입+SoA 버퍼) → Phase 2′(sorted-x cull + per-series min/max 다운샘플) → Phase 3′(다운샘플된 visible만 신규 incremental draw) → Phase 4′(델타/back-pressure) → Phase 5′(Worker+OffscreenCanvas, **필요 시에만**) → Phase 6′(scroll-blit/dirty-rect, 마지막).

### 누락 위험 (착수 전 설계에 반영)
- **multi-series**: `seriesId` 하나로 부족. 현재 렌더러는 시리즈별 그룹화+안정정렬(`canvas-render.ts:41`). 다운샘플·cull·last-point continuity·색상·tooltip metadata 모두 **시리즈 단위** 설계 필요.
- **카테고리 x축**: 전역 사전 필요. `newPoints`만으로 category map 만들면 위치가 흔들림(`canvas-render.ts:79`).
- **Float 정밀도**: `Float64Array` 고정 재검토. Date epoch x는 `Float64` 또는 `baseTime + Float32 offset`, y는 `Float32` 가능, category는 정수 인코딩.
- **transferable detach**: `postMessage([buffer])` 후 sender 버퍼가 detach됨 → **double-buffering/버퍼 풀/ownership 상태** 필요(Phase 5′).
- **OffscreenCanvas/Safari**: Safari 16.x partial → **17+ 안전**. 텍스트/폰트/`measureText`는 **실브라우저 골든 테스트**로 검증.
- **published export 경로 깨짐(정밀화)**: `dist/charts/line.js`는 tsc가 dist 루트로 emit하나, export map은 `dist/esm/charts/line.js`·`dist/cjs/charts/line.js`를 가리켜 미해소. → 빌드 변경 시 **export map을 실제 emit 경로에 맞추거나 rollup preserveModules로 esm/cjs 하위에 emit**.

---

## Phase 0 — 측정 하네스 (다른 모든 것의 전제, ~0.5d)
> ⚠️ **실브라우저 벤치 필수.** 현재 perf test는 jsdom이라 canvas를 mock함(`tests/performance/realtime-update.test.ts:26`, `vitest.config.ts`) → 렌더 비용 측정 불가. Playwright 등 실제 Canvas 환경에서 측정.

성능 목표는 "측정 가능해야" 의미가 있음. 회귀 방지 골든 게이트부터.

- **신규** `tests/performance/streaming-10mb.bench.ts`:
  - 10MB 상당 데이터 생성기(아래 Q2의 포인트 수 확정값 사용, 예: 250k pt/poll).
  - 60초(=60 poll) 시뮬레이션, `performance.now()`로 프레임 시간 수집.
  - **수용 기준**: p95 frame time < 16.67ms, p99 < 33ms(1프레임 드랍 허용), 힙 상한 < 설정 한도(예: 80MB), GC major pause 없음.
- 기존 `tests/performance/realtime-update.test.ts`, `fp-performance.test.ts`를 베이스라인으로 1회 실행해 **현재 수치 기록**(보고서의 ms 추정을 실측으로 대체).
- CI에 벤치 게이트 추가(`package.json` 스크립트 `test:perf`).

**산출물**: 현재 실측 baseline + 회귀 게이트. 이후 모든 Phase는 이 벤치로 검증.

---

## Phase 1 — 키스톤: typed-array SoA 링 버퍼 + 윈도우 상한 (P0, ~2-3d)

per-poll O(N) 복사 3회와 무한 성장, GC 압력을 한 번에 제거. **단일 최고 레버리지.**

### 1a. 신규 컬럼형 저장 `src/streaming/columnar-buffer.ts`
- 내부 표현 SoA + 링:
  ```ts
  interface ColumnarRingBuffer {
    readonly capacity: number;          // 픽셀폭 기반 상한
    push(xs: Float64Array, ys: Float64Array, seriesIds?: Uint16Array): void; // O(k), array.set
    size(): number;
    // zero-copy 뷰 (복사 없이 현재 윈도우 접근)
    view(): { xs: Float64Array; ys: Float64Array; seriesIds?: Uint16Array; start: number; count: number };
    clear(): void;
  }
  ```
- `xs`/`ys`는 `Float64Array`, 시리즈는 **dictionary-encoded**(`series:string` → `Uint16Array` id + `string[]` 사전). 링이 차면 head 전진(oldest drop), **재할당·복사 없음**.
- `x`가 `string`/`Date`인 경우 입력 경계에서 1회 정규화(Date→ms, 카테고리→사전 인덱스). 이종 분기를 핫패스에서 제거.

### 1b. 인코더 `src/streaming/encode-points.ts`
- `encodePoints(points: readonly DataPoint[]): { xs, ys, seriesIds, dict }` — `DataPoint[]` → SoA 1회 변환. (Worker 경계/소비자 입력에서 사용; Phase 4에서 Worker로 이동.)
- 역방향 `decodePoint(view, i): DataPoint` — 호버/툴팁 등 개별 접근용(드물게).

### 1c. `data-buffer.ts` 리팩터 (인터페이스 보존)
- `DataBuffer`의 공개 시그니처(`getCurrent/getPending/addPoints/flush/...`)는 **유지**(back-compat). 내부만 columnar-buffer로 교체.
- `getCurrent()`의 `[...current]` 방어 복사(`:58`) → **zero-copy `view()` 우선 경로** 추가. 기존 `DataPoint[]` 반환 메서드는 deprecated 표시 후 lazy decode.
- `flush()`의 `current = [...current, ...pending]`(`:83`) → 링 `push`로 O(k).

### 1d. `incremental-renderer.ts` 배선 — **dual-mode (Q1 결정: 토글)**
- `IncrementalRenderOptions`에 `windowMode?: 'sliding' | 'accumulate'`(기본 `'sliding'`) + `maxPoints?`(sliding 상한) 추가.
  - **sliding(기본)**: `capacity = clamp(width * 2, 2_000, 50_000)`, 링이 차면 oldest drop + 자동 스크롤.
  - **accumulate(opt-in)**: 링 drop 비활성(grow). **단 per-frame은 여전히 O(visible)** — Phase 2 증분 draw + Phase 3 다운샘플 + Phase 5 cull로 그리기 비용은 누적과 무관하게 유지. 메모리만 SoA로 ~3-5× 절감(객체 alloc/GC는 여전히 제거). UI에 윈도우 모드 토글 노출.
- `onFrameRender`(`:85`)에서 `[...dataBuffer.getCurrent()]`(`:93`) 제거 → `view()` 사용.
- `data-manager.ts addPoints`(`:73-81`)의 `[...currentDataset.points, ...points]` full copy → 버퍼 `push` 경유로 전환(또는 columnar 우회).

**검증**: Phase 0 벤치에서 per-poll 복사 시간 8-20ms → <1ms, 힙 상한 고정, GC pause 소거 확인.

---

## Phase 2 — 매 프레임 full redraw 중단 → 증분 draw (P0, ~1-2d)

per-frame 비용을 O(전체) → O(신규 또는 픽셀수)로.

- `onFrameRender`(`incremental-renderer.ts:100`)의 `renderToCanvas(전체)` →:
  - **append 케이스**: 이미 export됐지만 호출처 0인 `renderIncrementalToCanvas`(`canvas-render.ts:292`)를 실제 연결. 신규 구간만 오프스크린에 덧그림.
  - **rescale/replace 케이스**에만 full redraw.
- 매 프레임 `calculateViewportFromDataset(전체)`(`:97`) 제거. **단 sliding window의 min/max는 단순 running min/max로 O(1)이 안 됨** — 오래된 극값이 빠질 때 재계산 필요. → **monotonic deque 또는 bucket aggregate**로 amortized O(1). accumulate 모드는 appendable min/max bucket/pyramid.
- append-only 시 **dirty-rect / scroll-blit** 옵션(`:103-104`): 전체 clearRect 대신 새로 들어온 폭만 갱신(Q1이 sliding window면 자연스러움).
- `getChartRenderer` incremental 경로의 비-exhaustive dispatch 결함(pie가 line으로 오렌더, `canvas-render.ts:331-354`)도 이때 `assertNever`로 함께 수정.

**검증**: 1만 누적 후에도 프레임 시간이 일정(누적 무관) 확인.

---

## Phase 3 — 화면해상도 다운샘플 (P0, ~1-2d)

draw + scan 대상을 누적 포인트가 아니라 ~픽셀 수로 한정. aliasing 제거.

- **신규** `src/utils/downsample.ts`:
  - `minMaxPerPixel(xs, ys, pixelWidth): {xs, ys}` — 픽셀당 min/max 2점, single O(N), 피크 보존.
  - (선택) `lttb(xs, ys, threshold)` — Largest-Triangle-Three-Buckets, 시각 충실도 우선 시.
- `line.ts:61`의 blind-stride 가상화 경로를 **min/max 다운샘플로 교체**, **poll당 1회**만 수행(매 프레임 X). 결과를 캐시.
- `scatter.ts:54`도 동일 적용.
- `virtualization.ts`의 stride 샘플링(`:99-104`)은 deprecated 처리하거나 min/max로 수렴.

**검증**: 250k→~픽셀수(2-4k) 감축에서 시각적 피크 유지 + draw < 6ms.

---

## Phase 4 — 진짜 off-thread: Worker + OffscreenCanvas (P1, ~3-5d) — **Q3 결정: 최신 브라우저 타깃**

소비자의 15-40ms JSON.parse와 diff/downsample을 메인스레드에서 제거. 현재 `offscreen-canvas.ts:42`는 `document.createElement('canvas')`(in-DOM)일 뿐 — 진짜 OffscreenCanvas 아님.

- **타깃**: OffscreenCanvas 2D 지원 브라우저(최신 Chrome/Edge/Firefox, Safari 16.4+)를 **기본 경로**로 가정. Worker 경로가 1급 시민.
- **신규** `src/api/incremental/render-worker.ts`(Worker entry): parse → encode(SoA) → ring push → delta → downsample → OffscreenCanvas 2D draw.
- `offscreen-canvas.ts:42`: `canvas.transferControlToOffscreen()`로 컨트롤 이전, `postMessage`로 ArrayBuffer **zero-copy transfer**(`[buffer]` transferable).
- feature-detect(`typeof OffscreenCanvas`, worker module 지원) → 미지원 구형 브라우저는 Phase 1-3의 메인스레드 경로로 graceful degrade(이 경우 10MB/s@60fps **목표 미보장**, 경고 로그). 최신 브라우저에서만 목표 보장.
- rollup에 worker 번들 출력 추가(아래 빌드 변경과 함께).

**검증**: 메인스레드 long task(>50ms) 0, 입력 parse가 프레임 예산에서 분리됨.

---

## Phase 5 — sorted-x binary-search cull + viewport 캐시 (P1, ~1d)

- `virtualization.ts:63-79`의 O(N) 선형 스캔 → x가 정렬돼 있다는 전제(스트리밍은 단조 증가) 하에 **2× 이분 탐색**(`lowerBound`/`upperBound`)으로 O(log N + visible).
- per-point `typeof`/`instanceof Date`/`parseFloat` 제거(Phase 1에서 SoA `xs:Float64Array`로 이미 정규화됨).
- 프레임 간 `[lo,hi]` 캐시 — 팬/줌 없으면 재계산 생략.

---

## Phase 6 — 델타 O(1) append + 중복 복사 제거 (P1, ~1d)

- `delta-calculator.ts:84-152`: append 흔한 케이스를 O(1) 길이/꼬리 비교로 fast-path(현재 3×O(N) replace 경로로 빠질 수 있음). `skipPrependCheck` 옵션.
- `incremental-renderer.ts:155,167`의 호출처 재복사 제거(no-copy accessor).
- `createRenderQueue()`(`:77`)에 `maxSize` 지정 + `frame-scheduler.ts:159` `pendingPoints` 상한 + `droppedCount` 노출 → **back-pressure** 실제 작동(현재 drop 로직 dead).

---

## 빌드 변경 (Phase 1·4와 함께, P0/P1)

감사에서 확인된 published 계약 위반 동반 수정:
- `rollup.config.js:34-60`: 현재 `esm/index.js`·`cjs/index.js`만 emit.
  - `output.dir` + `preserveModules:true` + `preserveModulesRoot:'src'`로 **서브패스 JS emit**(`./charts/line` 등 4개가 런타임 미해소 상태).
  - **UMD 빌드 추가**(`format:'umd'`, `name:'XelChart'`) → `dist/index.umd.js`(`installation.mdx:49`가 광고하나 미빌드).
  - `@chart/*` alias 플러그인 유지 필수.
  - Worker 청크 출력(Phase 4).
- postbuild smoke test: `import '@xelstack/chart-core/charts/line'`, UMD global 로드 확인.

---

## 병렬 트랙 A — 문서 P0 (성능과 독립, ~1-2d)

코드 변경 없이 즉시 가능. 순서:
1. **`api/chart-handle.mdx` 먼저** — `ChartHandle` 인터페이스에서 `getData`/`getConfig` 제거(`:20`), `getState()`로 교체. **근본 원인이라 1순위.**
2. `chart.getData()` 호출 15개 파일 일괄 → `getState().dataset` (sed-가능한 기계적 치환, 단 컨텍스트 확인).
3. import 정정: `/utils`·`/effects` 서브패스 → root; UMD는 Phase 빌드 후 유효해짐(그 전엔 광고 보류 또는 빌드 우선).
4. 미존재 심볼 제거: `type Chart`→`ChartHandle`, `LineChartConfig`/`BarChartConfig`→`ChartConfig`, `freeze`/`clone`/`getMinMax` 삭제.
5. 허위 config 스타일 필드 정정(render-option으로만).

> 검증: 문서 코드블록을 실제 타입체크하는 스냅샷(가능하면 `LiveCodeEditor` 예제를 빌드에 포함)으로 회귀 방지.

## 병렬 트랙 B — FP P0/P1 (성능과 독립, ~2d)

1. **`Result<T,E>` ADT** `src/utils/fp/result.ts`(ok/err/map/flatMap/getOrElse/match). ⚠️ **hot-path 금지**(delta/canvas per-point 루프 X) — batch 경계(검증·생성)에서만.
2. **`*Safe` 검증 변형** `validation.ts`(throw 버전 유지) + `package.json`에 `./utils/validation` 서브패스 export.
3. **`Immutable<T>`/`ImmutableArray<T>` re-export**(`index.ts`, 0 런타임).
4. **`getState()` 스냅샷화**(`create-chart.ts:164`) — live 객체 노출 차단(Phase 1의 view()와 정합 주의: 스냅샷은 cold path만).
5. (P2) `flow`/`tap`/`identity`/data-last variant, `Option`/lens, curry 정합 + fp 유닛/타입 테스트(현재 0).

---

## 수용 테스트 (Definition of Done)

성능 목표는 **Phase 0 벤치 통과 = 완료**로 정의:
- 10MB/s × 60s, **p95 frame < 16.67ms**, p99 < 33ms, 힙 상한 고정, major GC pause 0, 메인스레드 long task 0(Phase 4 후).
- 시각 회귀: 다운샘플 후에도 피크/추세 보존(골든 이미지 비교).
- 문서: 변경된 코드 예제 전부 타입체크 통과.

---

## Open Decisions

- ~~**Q1. 스트리밍 시각 모델**~~ → **결정: 둘 다 지원(토글).** 기본 sliding window, opt-in accumulate. `windowMode` 옵션으로 노출(Phase 1d 반영).
- ~~**Q3. Worker/OffscreenCanvas 지원 범위**~~ → **결정: 최신 브라우저 타깃.** Worker+OffscreenCanvas가 기본 경로, 구형은 메인스레드 degrade(목표 미보장, Phase 4 반영).
- **Q2. 10MB당 포인트 수 확정**(미결): wire 포맷(JSON? 바이너리?)과 `DataPoint` 필드 사용량에 따라 250k±2×. 벤치 정밀도를 위해 1개 대표값 고정 필요. → Phase 0 착수 시 확정.
- **Q4. 입력 정렬 보장**(미결): x 단조 증가 가정(binary-search cull 전제). 비정렬 입력 허용 시 push 시 정렬/리젝트 정책 필요. → Phase 5 착수 시 확정.

---

## 추정 일정 (성능 트랙, 순차)
P0(Phase 0-3) ~5-8d → P1(Phase 4-6 + 빌드) ~6-8d. 문서/FP 트랙은 병렬 가능(~3-4d). **첫 체감 성능 개선은 Phase 1 직후.**
