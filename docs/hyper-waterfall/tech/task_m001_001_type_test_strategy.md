# Public Type을 위한 Type Test 전략

## 발견

`public-types.ts`는 runtime behavior가 거의 없는 type-only module이다.

따라서 `public-types.test.ts`를 일반 runtime unit test처럼 작성하면 테스트 신호가 약하다. 예를 들어 `const config: ChartConfig = ...`를 만든 뒤 `expect(config.type).toBe("line")`을 검증하는 것은 TypeScript assignability를 간접적으로 확인할 뿐, runtime behavior를 검증하지 않는다.

이 파일은 domain type contract test로 다뤄야 한다.

## 근거

- TypeScript `import type`은 type annotation과 declaration에만 사용되는 import이며 JavaScript output에서 제거된다.
- TypeScript `verbatimModuleSyntax`에서는 `type` modifier가 있는 import/export만 제거되고, type-only import intent를 명시적으로 표현한다.
- Vitest는 `expectTypeOf`와 `assertType`을 이용한 type testing을 지원한다.
- Vitest type test는 compiler가 정적으로 분석한다. Vitest 문서는 type test 안의 type error를 test error로 취급한다고 설명한다.
- Vitest `typecheck.enabled`는 기본값이 disabled다. 이 프로젝트는 `pnpm typecheck`로 `tsc --noEmit`도 실행하므로 package tsconfig에 포함된 colocated `.test.ts` file은 TypeScript로 계속 검사된다.

참고:

- TypeScript type-only imports and exports: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- TypeScript `verbatimModuleSyntax`: https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html
- Vitest testing types: https://vitest.dev/guide/testing-types
- Vitest `expectTypeOf`: https://vitest.dev/api/expect-typeof
- Vitest typecheck config: https://vitest.dev/config/typecheck

## 결정

`public-types.ts`에는 colocated domain type contract test를 사용한다.

테스트는 test 대상 module에서 직접 import해야 한다.

```ts
import type {
  AppendInput,
  ChartConfig,
  ColumnarPointBatch,
  PointObject,
  PointTuple,
} from "./public-types";
```

다음은 사용하지 않는다.

```ts
import type {} from "./public-types";
```

이 형태는 declaration을 import하지 않으며, 검증할 contract를 표현하지 않기 때문이다.

assignability와 shape assertion에는 `expectTypeOf`를 사용한다.

Public package entry export는 나중에 `src/index.ts` 또는 package-level API contract test를 통해 별도로 검증한다.

## 다시 볼 시점

- `createChart` 같은 public runtime API가 생길 때.
- integration/API contract test를 추가할 때.
- Vitest `--typecheck`를 `pnpm test`에서 켤지, type test를 `pnpm typecheck` 아래에 유지할지 결정할 때.
