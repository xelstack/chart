# Type Test Strategy For Public Types

## Finding

`public-types.ts`는 runtime behavior가 거의 없는 type-only module이다.

따라서 `public-types.test.ts`를 일반 runtime unit test처럼 작성하면 테스트 신호가 약하다. 예를 들어 `const config: ChartConfig = ...`를 만든 뒤 `expect(config.type).toBe("line")`을 검증하는 것은 TypeScript assignability를 간접적으로 확인할 뿐, runtime behavior를 검증하지 않는다.

이 파일은 domain type contract test로 다뤄야 한다.

## Evidence

- TypeScript `import type`은 type annotation과 declaration에만 사용되는 import이며 JavaScript output에서 제거된다.
- TypeScript `verbatimModuleSyntax`에서는 `type` modifier가 있는 import/export만 제거되고, type-only import intent를 명시적으로 표현한다.
- Vitest는 `expectTypeOf`와 `assertType`을 이용한 type testing을 지원한다.
- Vitest type tests are statically analyzed by the compiler; Vitest documentation says type errors inside a type test are treated as test errors.
- Vitest `typecheck.enabled` is disabled by default; this project also runs `tsc --noEmit` through `pnpm typecheck`, so colocated `.test.ts` files included by package tsconfig can still be checked by TypeScript.

References:

- TypeScript type-only imports and exports: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- TypeScript `verbatimModuleSyntax`: https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html
- Vitest testing types: https://vitest.dev/guide/testing-types
- Vitest `expectTypeOf`: https://vitest.dev/api/expect-typeof
- Vitest typecheck config: https://vitest.dev/config/typecheck

## Decision

Use colocated domain type contract tests for `public-types.ts`.

The test should import directly from the module under test:

```ts
import type {
  AppendInput,
  ChartConfig,
  ColumnarPointBatch,
  PointObject,
  PointTuple,
} from "./public-types";
```

Do not use:

```ts
import type {} from "./public-types";
```

because it imports no declarations and does not express the contract being tested.

Use `expectTypeOf` for assignability and shape assertions.

Public package entry export should be tested separately later, likely from `src/index.ts` or through package-level API contract tests.

## Revisit When

- Public runtime APIs such as `createChart` exist.
- We add integration/API contract tests.
- We decide whether to enable Vitest `--typecheck` in `pnpm test` or keep type tests under `pnpm typecheck`.
