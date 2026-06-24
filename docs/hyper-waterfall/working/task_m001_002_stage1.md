# task_m001_002 단계 완료보고

## 계획

`task_m001_002`의 목표는 public config와 internal normalized model 사이의 첫 경계를 만드는 것이었다.

계획된 범위:

- public type에서 initial dataset input 의미를 분리한다.
- internal normalized config type을 만든다.
- config normalization boundary를 만든다.
- runtime behavior 중심의 config normalization test를 추가한다.
- public package entry contract test는 조사 후 필요성을 재판단한다.

이번 단계에서 하지 않기로 한 것:

- `createChart` 구현
- append buffer 구현
- point encode 구현
- renderer 구현
- scheduler 구현
- downsampling 구현
- Effect dependency 도입

## 완료

완료된 코드 변경:

- `InitialDataInput`을 추가하고 `DatasetConfig.data`가 이를 사용하도록 변경했다.
- root public entry에서 `InitialDataInput`을 export했다.
- internal normalized model을 추가했다.
  - `SeriesId`
  - `SeriesDescriptor`
  - `NormalizedRealtimeOptions`
  - `NormalizedDatasetConfig`
  - `NormalizedChartConfig`
  - `ConfigValidationIssue`
  - `ConfigResult<T>`
- package-local path alias `@/* -> ./src/*`를 추가했다.
- Vitest resolver에 `@` alias를 추가했다.
- workspace TypeScript SDK를 보도록 `.vscode/settings.json`을 추가했다.
- `normalizeConfig` boundary를 구현했다.
- `normalizeRealtimeOptions`와 `normalizeDataset` helper를 분리했다.
- validation issue factory를 같은 파일 안에 두었다.
- `validateConfig`가 validation issue를 수집하고, `normalizeConfig`가 `ConfigResult`로 감싸도록 분리했다.

완료된 테스트:

- minimal realtime line config normalization
- missing realtime은 disabled ordered mode로 normalize
- explicit `realtime.ordered` 보존
- explicit dataset id 보존
- missing label은 dataset id로 fallback
- empty datasets validation issue 반환
- invalid chart type runtime validation issue 반환

## 검증

다음 명령을 실행했고 모두 통과했다.

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

## 계획 대비 차이

계획에서 조정된 부분:

- `packages/chart/src/index.test.ts`는 만들지 않았다.
- TanStack Query와 Effect 사례를 확인한 뒤, 단순 re-export smoke test는 현재 신호가 낮다고 판단했다.
- public entry contract test는 `createChart`, package `exports`, build output boundary가 생긴 뒤 다시 보기로 했다.
- `realtime` 생략 시 internal state는 `{ enabled: false, ordered: true }`로 확정했다.
- `docs/domain/06-api-contract.md`의 realtime 기본값 표현을 이 결정에 맞게 정정했다.
- TypeScript 6에서 `baseUrl`이 deprecated라 `paths` target을 `./src/*` 형태로 구성했다.
- invalid chart type test는 `as unknown as ChartConfig` 대신 `@ts-expect-error`를 사용했다.

계획대로 유지한 부분:

- `ChartOptions`는 추가하지 않았다.
- `SeriesId`는 아직 branded type이 아니라 `string`으로 두었다.
- config normalization은 point encode, buffer allocation, ordered invariant 검증을 하지 않는다.
- internal type은 root public entry에서 export하지 않는다.

## 사용자 피드백

이번 단계에서 반영된 사용자 판단:

- `index.test.ts`는 현재 의미가 약하므로 보류한다.
- `realtime` 생략은 realtime enabled가 아니라 disabled가 맞다.
- dataset normalization은 helper로 분리하되, currying보다 일반 함수 형태가 더 읽기 쉽다.
- validation과 normalization 책임은 분리한다.
- validation issue는 지금은 같은 파일 안의 factory 함수로 다룬다.
- issue code는 `Symbol()`이 아니라 string literal 기반으로 유지한다.

## 남은 작업

다음 task 후보:

```text
task_m001_003
```

추천 방향:

- import policy와 module boundary tooling을 정리한다.
- `@/*` alias를 internal source import로만 사용할지 규칙화한다.
- public package entry import와 internal alias import의 경계를 문서화한다.
- import 정렬 자동화 도입 여부를 결정한다.
- `@ianvs/prettier-plugin-sort-imports`를 우선 후보로 검토한다.
- TypeScript, Vitest, tsup build에서 alias/import 정책이 동일하게 동작하는지 검증한다.

대안 후보:

- input normalization boundary를 만든다.
- `PointObject`, `PointTuple`, `ColumnarPointBatch`를 내부 point/batch representation으로 변환하는 범위를 정한다.
- `Date` to epoch milliseconds, `null` to `NaN` gap encoding을 어느 boundary에서 처리할지 확정한다.
- typed-array hot path를 깨지 않는 input normalization test를 설계한다.
- `createChart` lifecycle skeleton을 먼저 만든다.
- config normalization result를 public creation flow에 연결한다.

## 다음 게이트

- 상태: 승인됨
- 승인자: user
- 날짜: 2026-06-24
- 다음 게이트: 최종보고서 작성
