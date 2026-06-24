# task_m001_002 피드백

## 2026-06-23

### 사용자 피드백

사용자는 `ChartOptions`를 지금 public type에 넣지 않는 방향이 맞다고 판단했다.

### 결정

`task_m001_002`에서는 `ChartOptions`를 public type에 추가하지 않는다.

### 영향

- `ChartConfig`는 당분간 `type`, `realtime`, `data` 중심으로 유지한다.
- scale, style, interaction, animation option은 실제 구현 의미가 생긴 뒤 public API에 추가한다.
- 빈 `ChartOptions` interface로 지원하지 않는 확장 가능성을 암시하지 않는다.

## 2026-06-23

### 사용자 피드백

사용자는 `DatasetConfig.data`와 `AppendInput`을 의미상 분리하는 방향에 동의했다.

### 결정

초기 dataset data를 표현하는 `InitialDataInput`을 추가하고, `DatasetConfig.data`는 `InitialDataInput`을 사용한다.

### 영향

- `AppendInput`은 `chart.append(seriesId, input)`의 realtime canonical path 의미를 유지한다.
- `InitialDataInput`은 `createChart` 시점의 초기 dataset input 의미를 가진다.
- 두 타입이 당장은 같은 shape를 공유해도, 나중에 정책이 달라질 때 타입을 쉽게 갈라낼 수 있다.

## 2026-06-23

### 사용자 피드백

사용자는 `DatasetConfig.id`를 optional로 유지하고, 없으면 normalization에서 internal id를 생성하는 방향에 동의했다.

### 결정

`DatasetConfig.id`는 optional로 유지한다. `id`가 없으면 config normalization boundary에서 deterministic `SeriesId`를 생성한다.

### 영향

- 처음 사용하는 사용자는 Chart.js처럼 쉽게 dataset을 만들 수 있다.
- realtime append를 쓰는 사용자는 명시적 `id`를 쓰도록 문서와 예제에서 권장한다.
- 예상 internal id 정책은 `series-0`, `series-1` 같은 index 기반 deterministic id다.

## 2026-06-23

### 사용자 피드백

사용자는 `SeriesId`를 일단 단순 string으로 두고, 필요하면 나중에 branded type으로 바꿀 수 있다고 판단했다.

### 결정

이번 task에서 `SeriesId`는 단순 string으로 둔다.

```ts
export type SeriesId = string;
```

### 영향

- 초기 internal model을 이해하고 직접 작성하기 쉽다.
- public dataset id와 internal series id를 자연스럽게 연결할 수 있다.
- branded type은 id 혼동이 실제 문제가 되거나 internal model이 커진 뒤 다시 검토한다.

## 2026-06-23

### 사용자 피드백

사용자는 config normalization이 chart type 검증, realtime 기본값 적용, dataset id/label 보정, `SeriesDescriptor`와 `NormalizedChartConfig` 생성까지만 맡는 방향에 동의했다.

### 결정

Config normalization은 public config를 internal normalized config로 바꾸는 경계까지만 책임진다.

### 영향

- `Date` to epoch milliseconds 변환, `null` to `NaN` 변환, ordered invariant 검증, buffer allocation은 이번 task에서 제외한다.
- point 값 처리는 input normalization task로 분리한다.
- storage와 rendering 책임이 config boundary에 섞이지 않게 한다.

## 2026-06-23

### 사용자 피드백

사용자는 내부 validation 실패 표현은 Result 계열을 쓰되, 장기적으로 Effect식 사고방식은 참고하고 지금은 최소 구현으로 가는 방향에 동의했다.

### 결정

이번 task에서는 외부 함수형 library 없이 `ConfigResult<T>` 계열 discriminated union을 사용한다.

예상 형태:

```ts
type ConfigResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ConfigValidationIssue[] };
```

### 영향

- internal config normalization은 여러 validation issue를 값으로 반환할 수 있다.
- public `createChart`는 나중에 이 Result를 받아 사용자에게는 단순 throw로 바꿀 수 있다.
- Effect dependency는 도입하지 않는다.
- Effect 코드를 복사하지 않는다.
- `ok`, `fail` helper는 필요할 때 최소 범위로만 추가한다.

## 2026-06-23

### 사용자 피드백

사용자는 internal type을 root public export에 포함하지 않기로 결정했다.

### 결정

`NormalizedChartConfig`, `SeriesDescriptor`, `ConfigResult` 같은 internal type은 `packages/chart/src/index.ts`에서 export하지 않는다.

### 영향

- 사용자는 public type만 package entry에서 import한다.
- internal model은 성능 최적화와 구현 변경에 맞춰 자유롭게 바꿀 수 있다.
- 내부 테스트는 필요한 경우 internal module을 직접 import해 검증한다.
- public API surface가 불필요하게 커지는 것을 막는다.

## 2026-06-23

### 사용자 피드백

사용자는 public package entry contract test를 이번 task에 포함하기로 결정했다.

### 결정

`task_m001_002`에서 `packages/chart/src/index.ts`의 public type export contract를 검증하는 테스트를 추가한다.

### 영향

- public type이 package entry에서 빠지는 실수를 초기에 잡는다.
- internal type이 root public export로 새지 않도록 보호한다.
- 실제 build output 기준 package contract test는 추후 build/publish boundary task에서 별도로 다룬다.

## 2026-06-23

### 사용자 피드백

사용자는 `index.test.ts` 자체가 의미 있는지 체감되지 않는다고 지적했다. 비즈니스 로직도 아니고, 유닛 테스트에서 테스트하려는 대상도 명확하지 않으므로 TanStack Query와 Effect 같은 현대 TypeScript library가 이런 테스트를 실제로 두는지 확인해 달라고 요청했다.

### 조사

확인한 범위에서 TanStack Query와 Effect는 타입 테스트를 적극적으로 사용한다.

- TanStack Query는 `*.test-d.tsx` 파일에서 `useQuery`, `QueryClient` 같은 공개 API의 타입 추론과 generic 제약을 검증한다.
- Effect는 `packages/effect/dtslint/*.tst.ts` 파일에서 `Effect`, `Array`, `Schema` 같은 공개 API의 타입 동작을 검증한다.
- 두 프로젝트 모두 단순히 `index.ts` re-export 여부만 검증하는 테스트를 중심 패턴으로 삼지는 않는다.

### 결정

이번 task에서는 `packages/chart/src/index.test.ts`를 만들지 않는다.

### 영향

- public entry contract test는 public runtime API, package `exports`, build output boundary가 생긴 뒤 다시 검토한다.
- 이번 task는 domain-local public type test와 config normalization runtime test에 집중한다.
- 추후 package boundary task에서 `publint`, `attw` 같은 검증 도구도 함께 검토한다.

## 2026-06-23

### 사용자 피드백

사용자는 `realtime`을 생략한 경우의 기본값은 realtime enabled가 아니라 disabled가 맞다고 판단했다.

### 결정

`ChartConfig.realtime`을 생략하면 config normalization은 다음 internal realtime state를 만든다.

```ts
{
  enabled: false,
  ordered: true,
}
```

`realtime: true`를 명시한 경우에만 realtime append/scheduler path를 활성화한다.

### 영향

- Chart.js-like 일반 사용자는 `realtime`을 몰라도 초기 dataset 기반 차트를 만들 수 있다.
- realtime append를 원하는 사용자는 `realtime: true` 또는 `realtime: { ordered }`를 명시한다.
- `ordered` 기본값은 realtime enabled 여부와 별개로 `true`를 유지한다.
- 이 정책은 `normalize-config.test.ts`에서 contract test로 고정한다.

## 2026-06-23

### 사용자 피드백

사용자는 import 정렬 도구는 지금 바로 도입하지 않고, 나중에 `@ianvs/prettier-plugin-sort-imports`를 넣는 방향으로 가자고 결정했다.

### 결정

현재 task에서는 import sort plugin을 설치하지 않는다. 추후 import 정렬 자동화가 필요해지면 `@ianvs/prettier-plugin-sort-imports`를 우선 후보로 검토한다.

### 영향

- 지금은 import member 순서를 수동으로 정리한다.
- 이번 task 범위가 public/internal type boundary에서 tooling 변경으로 넓어지는 것을 막는다.
- import 정렬 자동화가 필요해지는 시점에 Prettier plugin 방식으로 검토한다.

## 2026-06-24

### 사용자 피드백

사용자는 `task_m001_002` 완료 단계에서 다음 task 후보인 `task_m001_003`에 import 관련 작업을 넣고 싶다고 판단했다.

### 결정

`task_m001_003`의 우선 후보를 input normalization boundary에서 import policy와 module boundary tooling 정리로 조정한다.

### 영향

- `@/*` alias 사용 규칙을 internal source import 중심으로 정리한다.
- public package entry import와 internal module import의 경계를 문서화한다.
- import 정렬 자동화 도입 여부를 다시 검토한다.
- `@ianvs/prettier-plugin-sort-imports`를 우선 후보로 유지한다.
- TypeScript, Vitest, tsup build가 동일한 alias/import 정책을 이해하는지 검증하는 작업을 다음 task 범위에 포함한다.
- input normalization boundary는 후속 task 후보로 미룬다.
