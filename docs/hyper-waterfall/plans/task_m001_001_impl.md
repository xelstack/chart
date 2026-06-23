# task_m001_001 구현계획서

## Goal

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

## Files To Create

Stage 1:

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `prettier.config.js`
- `.prettierignore`
- `eslint.config.js`
- `packages/chart/package.json`
- `packages/chart/tsconfig.json`
- `packages/chart/vitest.config.ts`

Stage 2:

- `packages/chart/src/index.ts`
- `packages/chart/src/domain/public-types.ts`
- `packages/chart/src/domain/internal-types.ts`
- `packages/chart/src/domain/public-types.test.ts`

Stage 3:

- `docs/hyper-waterfall/working/task_m001_001_stage1.md`

## Files To Modify

- `docs/hyper-waterfall/orders/20260620.md`
- `docs/hyper-waterfall/plans/task_m001_001.md`

## Stage 1: Workspace And Toolchain Skeleton

### Human Types

1. Root `package.json`
2. Root `pnpm-workspace.yaml`
3. Root `tsconfig.base.json`
4. Root `prettier.config.js`
5. Root `.prettierignore`
6. Root `eslint.config.js`
7. `packages/chart/package.json`
8. `packages/chart/tsconfig.json`
9. `packages/chart/vitest.config.ts`

### Codex Explains

- 왜 root package는 private orchestration package인지
- 왜 실제 publish 대상은 `packages/chart`인지
- root scripts가 `pnpm -r ...`로 workspace package에 위임되는 방식
- `tsconfig.base.json`과 package-local `tsconfig.json`의 역할 차이
- Prettier가 formatting을 맡고 ESLint가 code-quality rule을 맡는 경계
- 초기 ESLint rule을 최소로 시작하는 이유

### Tooling Decisions To Encode

- package manager: `pnpm`
- workspace package: `packages/chart`
- package name: `@xelstack/chart`
- TypeScript: `typescript@6.0.3`
- test: `vitest`
- build candidate: `tsup`
- lint: `eslint` and TypeScript ESLint, minimal initial rules
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

### Verification

After Stage 1 files are typed:

```text
pnpm install
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
```

Expected result:

- `pnpm install` creates `pnpm-lock.yaml`.
- `pnpm typecheck` can run even before meaningful source code exists.
- `pnpm test` can run and report no tests or the first real test setup, depending on Vitest config.
- `pnpm lint` runs through the workspace package.
- `pnpm format:check` checks repository formatting.

If a tool fails because TypeScript `6.0.3` is too new for a dependency, stop and write a troubleshooting note before changing versions.

## Stage 2: Public Type Boundary Skeleton

### Human Types

1. `packages/chart/src/domain/public-types.ts`
2. `packages/chart/src/domain/internal-types.ts`
3. `packages/chart/src/index.ts`
4. `packages/chart/src/domain/public-types.test.ts`

### Codex Explains

- public type와 internal type을 분리하는 이유
- Chart.js-like public vocabulary가 internal hot path로 직접 흘러가면 안 되는 이유
- `PointObject`, `PointTuple`, `ColumnarPointBatch`가 input path tier를 표현하는 방식
- `null` y와 `NaN` gap sentinel의 차이
- 이 stage에서 `createChart`를 만들지 않는 이유
- `public-types.test.ts`는 runtime behavior unit test가 아니라 type contract test라는 점

### Human-Typed Public Types

이 stage의 첫 파일은 `packages/chart/src/domain/public-types.ts`다.

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

### Verification

After Stage 2 files are typed:

```text
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
```

Expected result:

- public types compile.
- `packages/chart/src/index.ts` exports public types.
- colocated domain type test imports directly from `./public-types`.
- public package entry export can be tested separately later.
- no `createChart` runtime implementation exists.

Test placement rule:

- Keep unit/domain tests colocated with source files, for example `packages/chart/src/domain/public-types.test.ts`.
- Use a separate `tests/` directory later only for integration or public API contract tests that span multiple modules.

Type test rule:

- For a domain-local type contract test, import types from the local module under test.
- Use `import type { ... } from "./public-types"` rather than an empty `import type {}`.
- Prefer `expectTypeOf` or `assertType` for type contracts.
- Runtime `expect(...)` assertions are not meaningful by themselves for a type-only module.

## Stage 3: Stage Report

### Human Types

No implementation code.

### Codex Explains

- planned files vs actual files
- command results
- any changes from this implementation plan
- whether the next task should be domain type refinement or toolchain correction

### Report To Create

```text
docs/hyper-waterfall/working/task_m001_001_stage1.md
```

### Verification

Before writing the stage report:

```text
git diff --check
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
```

## Out Of Scope

- Canvas rendering
- `createChart`
- append buffer
- downsampling
- RAF scheduler
- benchmark harness
- browser visual tests
- full DDD/FP workflow pattern
- `Result`/ADT/railway-oriented implementation
- public diagnostics API

## Approval

- Status: approved
- Approved by: user
- Date: 2026-06-22
