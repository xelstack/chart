# task_m001_001 구현계획서

## 목표

`task_m001_001`의 승인된 수행계획서를 실제 파일 작성 순서로 쪼갠다.

이번 구현계획의 목표는 사용자가 직접 이해하고 칠 수 있는 최소 TypeScript library skeleton을 만드는 것이다.

구현 범위는 다음으로 제한한다.

- pnpm workspace skeleton
- `@xelstack/chart` package skeleton
- TypeScript typecheck loop
- Vitest test loop
- ESLint minimal lint loop
- Prettier formatting loop
- 첫 public domain type entry

이번 구현계획이 승인되기 전에는 실제 구현 파일을 만들지 않는다.

## 생성할 파일

단계 1:

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `prettier.config.js`
- `.prettierignore`
- `eslint.config.js`
- `packages/chart/package.json`
- `packages/chart/tsconfig.json`
- `packages/chart/vitest.config.ts`

단계 2:

- `packages/chart/src/index.ts`
- `packages/chart/src/domain/public-types.ts`
- `packages/chart/src/domain/internal-types.ts`
- `packages/chart/src/domain/public-types.test.ts`

단계 3:

- `docs/hyper-waterfall/working/task_m001_001_stage1.md`

## 수정할 파일

- `docs/hyper-waterfall/orders/20260620.md`
- `docs/hyper-waterfall/plans/task_m001_001.md`

## 단계 1: Workspace와 Toolchain 골격

### 사용자가 직접 작성

1. Root `package.json`
2. Root `pnpm-workspace.yaml`
3. Root `tsconfig.base.json`
4. Root `prettier.config.js`
5. Root `.prettierignore`
6. Root `eslint.config.js`
7. `packages/chart/package.json`
8. `packages/chart/tsconfig.json`
9. `packages/chart/vitest.config.ts`

### Codex가 설명할 것

- 왜 root package는 private orchestration package인지
- 왜 실제 publish 대상은 `packages/chart`인지
- root scripts가 `pnpm -r ...`로 workspace package에 위임되는 방식
- `tsconfig.base.json`과 package-local `tsconfig.json`의 역할 차이
- Prettier가 formatting을 맡고 ESLint가 code-quality rule을 맡는 경계
- 초기 ESLint rule을 최소로 시작하는 이유

### 반영할 도구 결정

- 패키지 매니저: `pnpm`
- workspace package: `packages/chart`
- package name: `@xelstack/chart`
- TypeScript: `typescript@6.0.3`
- test: `vitest`
- build 후보: `tsup`
- lint: `eslint`와 TypeScript ESLint, 최소 초기 rule
- format: `prettier`
- Prettier config:

```js
/** @type {import("prettier").Config} */
const config = {
  semi: true,
  tabWidth: 2,
  useTabs: false,
};

export default config;
```

`prettier.config.js`를 사용한다. Root `package.json`이 `"type": "module"`이므로 `.js` config는 ESM으로 해석된다. CommonJS config가 필요할 때만 `prettier.config.cjs`로 바꾼다.

### 검증

단계 1 파일을 작성한 뒤:

```text
pnpm install
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
```

예상 결과:

- `pnpm install`은 `pnpm-lock.yaml`을 만든다.
- `pnpm typecheck`는 의미 있는 source code가 없어도 실행될 수 있다.
- `pnpm test`는 Vitest config에 따라 test 없음 또는 첫 실제 test setup을 보고할 수 있다.
- `pnpm lint`는 workspace package를 거쳐 실행된다.
- `pnpm format:check`는 repository formatting을 검사한다.

TypeScript `6.0.3`이 dependency보다 너무 새로워 tool이 실패하면, 버전을 바꾸기 전에 멈추고 troubleshooting note를 작성한다.

## 단계 2: Public Type 경계 골격

### 사용자가 직접 작성

1. `packages/chart/src/domain/public-types.ts`
2. `packages/chart/src/domain/internal-types.ts`
3. `packages/chart/src/index.ts`
4. `packages/chart/src/domain/public-types.test.ts`

### Codex가 설명할 것

- public type와 internal type을 분리하는 이유
- Chart.js-like public vocabulary가 internal hot path로 직접 흘러가면 안 되는 이유
- `PointObject`, `PointTuple`, `ColumnarPointBatch`가 input path tier를 표현하는 방식
- `null` y와 `NaN` gap sentinel의 차이
- 이 stage에서 `createChart`를 만들지 않는 이유
- `public-types.test.ts`는 runtime behavior unit test가 아니라 type contract test라는 점

### 사용자가 직접 작성할 Public Type

이 단계의 첫 파일은 `packages/chart/src/domain/public-types.ts`다.

처음 칠 타입:

- `ChartType`
- `TimeValue`
- `YValue`
- `PointObject`
- `PointTuple`
- `ColumnarPointBatch`
- `AppendInput`
- `ChartConfig`
- `ChartData`
- `DatasetConfig`
- `RealtimeOptions`

`packages/chart/src/domain/internal-types.ts`는 아직 구현을 시작하지 않는다. 이 파일은 다음 task에서 internal model을 받을 수 있도록 빈 export boundary 또는 최소 type-only export로 구성한다.

### 검증

단계 2 파일을 작성한 뒤:

```text
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
```

예상 결과:

- public type이 compile된다.
- `packages/chart/src/index.ts`가 public type을 export한다.
- colocated domain type test가 `./public-types`에서 직접 import한다.
- public package entry export는 나중에 별도로 test할 수 있다.
- `createChart` runtime implementation은 아직 없다.

테스트 배치 규칙:

- unit/domain test는 `packages/chart/src/domain/public-types.test.ts`처럼 source file 옆에 colocate한다.
- 별도 `tests/` directory는 여러 module을 가로지르는 integration 또는 public API contract test가 필요할 때만 나중에 사용한다.

Type test 규칙:

- domain-local type contract test에서는 test 대상 local module에서 type을 import한다.
- 빈 `import type {}` 대신 `import type { ... } from "./public-types"`를 사용한다.
- type contract에는 `expectTypeOf` 또는 `assertType`을 선호한다.
- type-only module에서 runtime `expect(...)` assertion만으로는 의미 있는 신호를 주기 어렵다.

## 단계 3: 단계 완료보고

### 사용자가 직접 작성

구현 코드는 없다.

### Codex가 설명할 것

- 계획 파일과 실제 파일의 차이
- command 결과
- 구현계획서 대비 변경점
- 다음 task가 domain type refinement인지 toolchain correction인지

### 생성할 보고서

```text
docs/hyper-waterfall/working/task_m001_001_stage1.md
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

- Canvas rendering
- `createChart`
- append buffer
- downsampling
- RAF scheduler
- benchmark harness
- browser visual tests
- 전체 DDD/FP workflow pattern
- `Result`/ADT/railway-oriented implementation
- public diagnostics API

## 승인

- 상태: 승인됨
- 승인자: user
- 날짜: 2026-06-22
