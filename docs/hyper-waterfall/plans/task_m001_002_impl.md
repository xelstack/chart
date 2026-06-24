# task_m001_002 구현계획서

## 목표

승인된 `task_m001_002` 수행계획서를 사용자가 직접 이해하고 칠 수 있는 코드 작성 순서로 쪼갠다.

이번 구현계획의 목표는 public type을 한 단계 정리하고, public config를 internal normalized config로 바꾸는 첫 boundary를 만드는 것이다.

이번 구현계획이 승인되기 전에는 실제 구현 파일을 만들지 않는다.

## 생성할 파일

단계 2:

- `packages/chart/src/config/normalize-config.ts`
- `packages/chart/src/config/normalize-config.test.ts`

단계 3:

- `docs/hyper-waterfall/working/task_m001_002_stage1.md`

## 수정할 파일

- `packages/chart/src/domain/public-types.ts`
- `packages/chart/src/domain/public-types.test.ts`
- `packages/chart/src/domain/internal-types.ts`
- `packages/chart/src/index.ts`
- `docs/hyper-waterfall/orders/20260623.md`
- `docs/hyper-waterfall/plans/task_m001_002.md`
- `docs/hyper-waterfall/feedback/task_m001_002_feedback.md`

## 단계 1: Public Type Refinement

### 사용자가 직접 작성

1. `packages/chart/src/domain/public-types.ts`
2. `packages/chart/src/domain/public-types.test.ts`
3. `packages/chart/src/index.ts`

### Codex가 설명할 것

- `AppendInput`과 `InitialDataInput`을 분리하는 이유
- `ChartOptions`를 지금 넣지 않는 이유
- public type은 사용자가 import하는 계약이라는 점
- root package entry에는 public type만 export해야 한다는 점

### 변경 방향

`public-types.ts`에 `InitialDataInput`을 추가한다.

```ts
export type InitialDataInput = AppendInput;
```

`DatasetConfig.data`는 `AppendInput`이 아니라 `InitialDataInput`을 사용한다.

```ts
export interface DatasetConfig {
  id?: string;
  label?: string;
  data: InitialDataInput;
}
```

`ChartOptions`는 추가하지 않는다.

`index.ts`는 새 public type인 `InitialDataInput`을 export한다.

### 검증

단계 1 파일을 작성한 뒤:

```text
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
```

예상 결과:

- 기존 public type test가 계속 통과한다.
- `InitialDataInput`이 `AppendInput`과 같은 shape를 공유한다.
- `ChartConfig`는 여전히 `options` 없이 compile된다.

## 보류: Public Entry Contract Test

### 결정

이번 task에서는 `packages/chart/src/index.test.ts`를 만들지 않는다.

### 이유

- 현재 `index.ts`는 단순 type re-export라서 테스트 신호가 낮다.
- `InitialDataInput` export 여부만 보는 테스트는 비즈니스 로직이나 중요한 타입 추론을 검증하지 않는다.
- TanStack Query와 Effect는 타입 테스트를 많이 하지만, 주로 공개 API의 타입 의미를 검증한다.
- public runtime API, package exports, build output boundary가 생긴 뒤 package-level contract test로 다루는 편이 낫다.

### 다시 볼 시점

- `createChart`, `append`, package `exports`, build output이 생겼을 때
- public entry가 runtime API와 type API를 함께 노출하기 시작할 때
- `publint`, `attw` 같은 package contract 검증을 도입할 때

## 단계 2: Internal Type과 Config Normalization Boundary

### 사용자가 직접 작성

1. `packages/chart/src/domain/internal-types.ts`
2. `packages/chart/src/config/normalize-config.ts`
3. `packages/chart/src/config/normalize-config.test.ts`

### Codex가 설명할 것

- public `DatasetConfig`가 internal `SeriesDescriptor`로 바뀌는 이유
- `SeriesId`를 일단 `string`으로 두는 이유
- `ConfigResult<T>`가 throw보다 test-friendly한 이유
- config normalization이 point encode나 buffer allocation을 하지 않는 이유
- `normalizeConfig`가 `createChart`가 아니라는 점

### Internal Type 방향

`internal-types.ts`에는 public entry로 export하지 않는 internal type을 둔다.

예상 type:

```ts
export type SeriesId = string;

export interface SeriesDescriptor {
  id: SeriesId;
  label: string;
  type: ChartType;
  visible: boolean;
}

export interface NormalizedRealtimeOptions {
  enabled: boolean;
  ordered: boolean;
}

export interface NormalizedDatasetConfig {
  series: SeriesDescriptor;
  data: InitialDataInput;
}

export interface NormalizedChartConfig {
  type: ChartType;
  realtime: NormalizedRealtimeOptions;
  datasets: NormalizedDatasetConfig[];
}
```

Validation issue와 result는 config boundary에서 사용할 최소 형태로 둔다.

```ts
export type ConfigValidationIssueCode = "invalid_chart_type" | "empty_datasets";

export interface ConfigValidationIssue {
  code: ConfigValidationIssueCode;
  message: string;
}

export type ConfigResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ConfigValidationIssue[] };
```

`ok`, `fail` helper는 중복이 보일 때만 추가한다. 처음 구현에서는 inline object literal로 시작해도 된다.

### Config Normalization 방향

`normalize-config.ts`는 public config를 받아 internal normalized config를 반환한다.

예상 signature:

```ts
export function normalizeConfig(
  config: ChartConfig,
): ConfigResult<NormalizedChartConfig>;
```

이번 task에서 할 일:

- `type`이 `"line"` 또는 `"area"`인지 확인한다.
- `realtime` 기본값을 `{ enabled: false, ordered: true }` 또는 `{ enabled: true, ordered: true }`로 normalize한다.
- dataset id가 없으면 `series-0`, `series-1`처럼 deterministic id를 만든다.
- dataset label이 없으면 id를 label fallback으로 사용한다.
- dataset별 `SeriesDescriptor`를 만든다.
- dataset data는 encode하지 않고 `InitialDataInput`으로 넘긴다.

이번 task에서 하지 않을 일:

- `Date` to epoch milliseconds
- `null` to `NaN`
- ordered invariant 검증
- `Float64Array` allocation
- buffer append
- render scheduling

### Test 방향

`normalize-config.test.ts`는 runtime behavior를 검증한다.

검증할 것:

- minimal realtime line config가 normalize된다.
- `realtime: true`는 ordered true로 normalize된다.
- realtime option object의 `ordered` 값이 반영된다.
- missing dataset id는 deterministic `series-0`으로 보정된다.
- missing label은 id 기반 fallback을 사용한다.
- empty datasets는 error result가 된다.

`ChartConfig.type`은 TypeScript public type이 이미 `"line" | "area"`로 제한하므로, invalid chart type runtime test는 필요하면 test 안에서 `unknown as ChartConfig`로 우회해 검증한다.

### 검증

단계 2 파일을 작성한 뒤:

```text
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
```

예상 결과:

- config normalization unit test가 통과한다.
- public entry는 internal type을 export하지 않는다.
- `createChart`는 여전히 존재하지 않는다.

## 단계 3: 단계 완료보고

### 사용자가 직접 작성

구현 코드는 없다.

### Codex가 설명할 것

- 계획 파일과 실제 파일의 차이
- command 결과
- public/internal boundary가 어떻게 고정되었는지
- 다음 task가 input normalization인지 createChart lifecycle인지

### 생성할 보고서

```text
docs/hyper-waterfall/working/task_m001_002_stage1.md
```

### 검증

단계 완료보고를 작성하기 전에:

```text
git diff --check
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
```

## 범위 밖

- `createChart`
- chart instance object
- append method
- storage buffer
- point encode
- downsampling
- RAF scheduler
- Canvas renderer
- browser visual test
- benchmark
- Effect dependency
- branded `SeriesId`

## 승인

- 상태: 승인됨
- 승인자: user
- 날짜: 2026-06-23
