# task_m001_002 최종보고서

## 목표

`task_m001_002`의 목표는 Chart.js-like public config와 성능 중심 internal normalized model 사이의 첫 경계를 만드는 것이었다.

이번 task는 `createChart`, renderer, append buffer로 들어가기 전에 public type의 의미를 정리하고, public config가 internal hot path로 직접 흘러가지 않도록 config normalization boundary를 만드는 작업이었다.

## 결과

완료된 결과:

- `InitialDataInput`을 추가했다.
- `DatasetConfig.data`가 `AppendInput` 대신 `InitialDataInput`을 사용하도록 변경했다.
- root public entry에서 `InitialDataInput`을 export했다.
- internal normalized model을 추가했다.
  - `SeriesId`
  - `SeriesDescriptor`
  - `NormalizedRealtimeOptions`
  - `NormalizedDatasetConfig`
  - `NormalizedChartConfig`
  - `ConfigValidationIssue`
  - `ConfigResult<T>`
- `normalizeConfig` boundary를 구현했다.
- config normalization runtime test를 추가했다.
- `realtime` 생략 시 `{ enabled: false, ordered: true }`로 normalize하도록 정책을 확정했다.
- `docs/domain/06-api-contract.md`의 realtime 기본값 표현을 정정했다.
- package-local path alias `@/* -> ./src/*`를 추가했다.
- Vitest resolver에 `@` alias를 추가했다.
- workspace TypeScript SDK를 보도록 `.vscode/settings.json`을 추가했다.
- `packages/chart/src/index.test.ts`는 조사 후 보류했다.

완료된 `normalizeConfig` 검증 범위:

- minimal realtime line config normalization
- missing realtime default normalization
- explicit `realtime.ordered` 보존
- explicit dataset id 보존
- dataset label fallback
- empty datasets validation issue
- invalid chart type runtime validation issue

## 검증

최종 검증:

```text
pnpm typecheck
```

통과.

```text
pnpm test
```

통과.

테스트 결과:

```text
Test Files  2 passed (2)
Tests       10 passed (10)
```

```text
pnpm lint
```

통과.

```text
pnpm format:check
```

통과.

```text
git diff --check
```

통과.

추가 문서 검증:

```text
pnpm exec prettier "docs/**/*.md" --check
```

통과.

## 계획 대비 실제

계획대로 완료:

- `ChartOptions`는 추가하지 않았다.
- public type에서 initial dataset input 의미를 분리했다.
- internal normalized config type을 만들었다.
- config normalization boundary를 만들었다.
- validation result는 외부 dependency 없이 discriminated union으로 표현했다.
- `createChart`, renderer, append buffer, point encode, downsampling, RAF scheduler는 만들지 않았다.
- internal type은 root public entry에서 export하지 않았다.

계획에서 조정된 부분:

- public package entry contract test는 이번 task에서 만들지 않았다.
- TanStack Query와 Effect 사례를 확인한 뒤, 단순 re-export smoke test는 현재 신호가 낮다고 판단했다.
- public entry contract test는 public runtime API와 build output boundary가 생긴 뒤 다시 보기로 했다.
- `realtime` 생략은 realtime enabled가 아니라 disabled로 확정했다.
- invalid chart type runtime test는 `as unknown as ChartConfig` 대신 `@ts-expect-error`를 사용했다.
- TypeScript 6에서 `baseUrl`이 deprecated라 `paths` target을 `./src/*`로 구성했다.
- `task_m001_003` 후보를 input normalization에서 import policy와 module boundary tooling 정리로 조정했다.

## 남은 작업

다음 task 후보:

```text
task_m001_003
```

추천 목표:

```text
import policy and module boundary tooling
```

다음 task에서 다룰 것:

- `@/*` alias 사용 규칙을 internal source import 중심으로 정리한다.
- public package entry import와 internal module import의 경계를 문서화한다.
- import 정렬 자동화 도입 여부를 결정한다.
- `@ianvs/prettier-plugin-sort-imports`를 우선 후보로 검토한다.
- TypeScript, Vitest, tsup build에서 alias/import 정책이 동일하게 동작하는지 검증한다.

후속 task 후보:

- input normalization boundary
- `Date` to epoch milliseconds 변환
- `null` to `NaN` gap encoding
- typed-array hot path 보존 테스트
- `createChart` lifecycle skeleton
- config normalization result를 public creation flow에 연결

## 배운 점

- `index.ts` re-export smoke test는 public runtime API가 없을 때 신호가 낮다.
- 타입 테스트는 단순 export 존재 여부보다 public API의 타입 의미를 검증할 때 가치가 크다.
- config normalization은 cold path이므로 지금은 가독성과 책임 분리를 우선한다.
- validation과 normalization을 분리하면 `normalizeConfig`가 boundary orchestration 역할로 읽힌다.
- validation issue는 배열로 수집하는 형태가 사용자에게 여러 문제를 한 번에 보여주기 좋다.
- issue code는 `Symbol()`보다 string literal이 test, JSON, diagnostics에 적합하다.
- TypeScript 6 기준으로 `paths`는 `baseUrl` 없이 `./src/*` 형태로 구성하는 편이 맞다.
- import policy는 단순 취향이 아니라 public/internal module boundary와 build/test tooling에 영향을 준다.

## 승인

- 상태: 승인됨
- 승인자: user
- 날짜: 2026-06-24
