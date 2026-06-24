# task_m001_003 구현계획서

## 목표

`task_m001_003`의 목표는 import policy와 module boundary tooling을 실제 repo 설정에 반영하는 것이다.

이번 구현은 runtime behavior를 바꾸지 않는다. 변경 대상은 import 정렬, self-import 금지, package build/declaration 검증, 그리고 관련 문서 정리다.

## 확정 결정

이번 구현계획서는 다음 결정을 기준으로 한다.

- import order는 `side-effect -> external package -> @/* internal alias -> relative` 순서로 한다.
- side-effect import는 최상단에 두고, side-effect import끼리는 작성 순서를 보존한다.
- type import는 value import와 별도 group으로 분리하지 않고 같은 source group 안에 둔다.
- `@ianvs/prettier-plugin-sort-imports`를 이번 task에서 도입한다.
- `@xelstack/chart`, `@xelstack/chart/*` self-import는 `packages/chart/src/**` 내부에서 ESLint로 금지한다.
- build tool은 `tsup`에서 `tsdown`으로 바꾼다.
- `tsdown`의 build-time Node.js 요구사항은 `22.18.0+`로 받아들인다.
- build output 검증을 완료 조건에 포함한다.
- public API contract test directory는 지금 만들지 않고, `createChart` runtime public API가 생긴 뒤 추가한다.

## 참고할 스킬

구현 전에 다음 프로젝트 스킬을 읽는다.

- `.agents/skills/xel-chart-hyper-waterfall/SKILL.md`
- `.agents/skills/tsdown/SKILL.md`

이번 task에서 직접 참고할 tsdown reference:

- `.agents/skills/tsdown/references/option-config-file.md`
- `.agents/skills/tsdown/references/option-dts.md`
- `.agents/skills/tsdown/references/option-output-format.md`
- `.agents/skills/tsdown/references/guide-migrate-from-tsup.md`

## 생성할 파일

- `packages/chart/tsdown.config.ts`
  - `@xelstack/chart` package의 library build 설정을 담당한다.
  - `src/index.ts`를 entry로 사용한다.
  - ESM/CJS JS output과 declaration output을 한 도구에서 생성한다.

## 수정할 파일

- `package.json`
  - root devDependencies에서 `tsup`을 제거한다.
  - root devDependencies에 `tsdown`과 `@ianvs/prettier-plugin-sort-imports`를 추가한다.
- `pnpm-lock.yaml`
  - dependency 변경 결과로 갱신한다.
- `prettier.config.js`
  - import sort plugin과 import order를 설정한다.
- `eslint.config.js`
  - `packages/chart/src/**` 내부 self-import 금지 rule을 추가한다.
- `packages/chart/package.json`
  - `build` script를 `tsdown`으로 바꾼다.
- `packages/chart/tsconfig.json`
  - `tsdown.config.ts`를 package typecheck 대상으로 포함한다.
- `packages/chart/src/config/normalize-config.test.ts`
  - import order plugin 결과에 맞춰 import 순서가 정리될 수 있다.
- `packages/chart/src/config/normalize-config.ts`
  - import order plugin 결과에 맞춰 import 순서가 정리될 수 있다.
- `packages/chart/src/domain/public-types.test.ts`
  - import order plugin 결과에 맞춰 import 순서가 정리될 수 있다.
- `docs/hyper-waterfall/tech/task_m001_003_import_policy.md`
  - 실제 구현 결과와 build 검증 결과를 반영한다.

## 수정하지 않는 파일

- `packages/chart/src/index.ts`
  - 현재 public type만 export하고 있으므로 이번 구현에서 runtime public API를 추가하지 않는다.
- `packages/chart/vitest.config.ts`
  - 현재 `@ -> ./src` alias가 task 목적에 맞으므로 동작 변경은 하지 않는다. Prettier 정렬만 적용될 수 있다.

## 단계 1: build/import tooling dependency 변경

### 사용자가 직접 작성

workspace root에서 다음 명령을 실행한다.

```text
pnpm remove -Dw tsup
pnpm add -Dw tsdown @ianvs/prettier-plugin-sort-imports
```

예상 변경:

- `package.json` root devDependencies에서 `tsup`이 제거된다.
- `package.json` root devDependencies에 `tsdown`이 추가된다.
- `package.json` root devDependencies에 `@ianvs/prettier-plugin-sort-imports`가 추가된다.
- `pnpm-lock.yaml`이 갱신된다.

### Codex가 설명할 것

- 왜 `tsup`을 유지하지 않고 `tsdown`으로 바꾸는지 설명한다.
- `tsdown`이 Rolldown 기반 library bundler이며 d.ts 생성을 직접 지원한다는 점을 설명한다.
- `tsdown`의 build-time Node.js 요구사항이 `22.18.0+`라는 점을 확인한다.
- Prettier config가 root에 있으므로 import sort plugin도 root devDependency에 두는 것이 자연스럽다는 점을 설명한다.
- 설치 후 `package.json`과 `pnpm-lock.yaml` diff를 리뷰한다.

### 검증

```text
pnpm exec prettier --version
pnpm exec tsdown --version
pnpm list @ianvs/prettier-plugin-sort-imports tsdown
```

기대:

- Prettier가 실행된다.
- `tsdown`이 실행된다.
- `@ianvs/prettier-plugin-sort-imports`와 `tsdown`이 workspace dependency tree에 보인다.

## 단계 2: Prettier import order 설정

### 사용자가 직접 작성

`prettier.config.js`를 다음 내용으로 바꾼다.

```js
/** @type {import("prettier").Config} */
const config = {
  semi: true,
  tabWidth: 2,
  useTabs: false,
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrder: [
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/",
    "",
    "^[.]",
  ],
  importOrderTypeScriptVersion: "6.0.3",
  importOrderCaseSensitive: false,
  importOrderSafeSideEffects: [],
};

export default config;
```

### Codex가 설명할 것

- `"<BUILTIN_MODULES>"`와 `"<THIRD_PARTY_MODULES>"`는 external package group으로 본다는 점을 설명한다.
- 빈 문자열 `""`은 import group 사이의 빈 줄을 만든다는 점을 설명한다.
- `"^@/"`는 scoped npm package인 `@scope/pkg`와 internal alias `@/`를 분리하기 위한 규칙이라고 설명한다.
- `"<TYPES>"`를 쓰지 않는 이유를 설명한다. type import는 value import와 같은 source group 안에 둔다.
- `importOrderSafeSideEffects: []`는 side-effect import를 안전하다고 간주해 재정렬하지 않겠다는 의도를 명시한다고 설명한다.

### 검증

```text
pnpm exec prettier prettier.config.js --check
```

기대:

- `prettier.config.js`가 Prettier check를 통과한다.

## 단계 3: import 정렬 적용

### 사용자가 직접 작성

다음 명령을 실행한다.

```text
pnpm exec prettier "packages/chart/src/**/*.ts" packages/chart/vitest.config.ts packages/chart/tsdown.config.ts eslint.config.js prettier.config.js --write
```

예상되는 대표 변경:

`packages/chart/src/config/normalize-config.test.ts`의 import는 다음 형태가 된다.

```ts
import { describe, expect, it } from "vitest";

import { normalizeConfig } from "@/config/normalize-config";
import type { ChartConfig } from "@/domain/public-types";
```

`packages/chart/src/config/normalize-config.ts`의 alias import는 source path 기준으로 정렬될 수 있다.

```ts
import type {
  ConfigResult,
  ConfigValidationIssue,
  NormalizedChartConfig,
  NormalizedDatasetConfig,
  NormalizedRealtimeOptions,
} from "@/domain/internal-types";
import type {
  ChartConfig,
  ChartType,
  DatasetConfig,
} from "@/domain/public-types";
```

### Codex가 설명할 것

- import specifier가 알파벳 순서로 정렬되는 것을 설명한다.
- external package와 `@/*` alias 사이에 빈 줄이 생기는 이유를 설명한다.
- type import가 별도 큰 group으로 내려가지 않는지 확인한다.
- side-effect import가 생길 경우 plugin이 기본적으로 그 import를 이동시키지 않는다는 점을 다시 설명한다.

### 검증

```text
pnpm format:check
```

기대:

- 모든 package의 Prettier check가 통과한다.

## 단계 4: self-import 금지 ESLint rule 추가

### 사용자가 직접 작성

`eslint.config.js`를 다음 내용으로 바꾼다.

```js
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["dist", "coverage", "node_modules"],
  },
  {
    files: ["**/*.{js,ts}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
  {
    files: ["packages/chart/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@xelstack/chart",
              message:
                "Do not self-import @xelstack/chart inside package source. Import internal modules via @/* or ./* instead.",
            },
          ],
          patterns: [
            {
              group: ["@xelstack/chart/*"],
              message:
                "Do not self-import @xelstack/chart subpaths inside package source. Keep package internals independent from the public entry.",
            },
          ],
        },
      ],
    },
  },
]);
```

### Codex가 설명할 것

- 왜 base `no-restricted-imports`를 끄고 `@typescript-eslint/no-restricted-imports`를 쓰는지 설명한다.
- rule scope를 `packages/chart/src/**`로 제한한 이유를 설명한다.
- future public API contract test가 생기면 `src` 밖에 둘 수 있으므로 이 rule과 충돌하지 않는다는 점을 설명한다.

### 검증

정상 경로 검증:

```text
pnpm lint
```

기대:

- 현재 source는 self-import를 쓰지 않으므로 lint가 통과한다.

실패 경로 검증:

```text
printf 'import type { ChartConfig } from "@xelstack/chart";\ntype Local = ChartConfig;\n' | pnpm exec eslint --stdin --stdin-filename packages/chart/src/__self_import_check__.ts
```

기대:

- ESLint가 `@typescript-eslint/no-restricted-imports` 에러로 실패한다.
- 검증용 파일은 실제로 생성하지 않는다.

## 단계 5: tsdown build 설정

### 사용자가 직접 작성

`packages/chart/tsdown.config.ts`를 새로 만든다.

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "es2022",
  outExtensions: ({ format }) => ({
    js: format === "esm" ? ".js" : ".cjs",
  }),
});
```

`packages/chart/package.json`의 `build` script를 다음으로 바꾼다.

```json
"build": "tsdown"
```

`packages/chart/tsconfig.json`의 `include`에 `tsdown.config.ts`를 추가한다.

```json
"include": ["src", "tests", "vitest.config.ts", "tsdown.config.ts"]
```

### Codex가 설명할 것

- `tsdown.config.ts`가 package build의 단일 진입점이라는 점을 설명한다.
- `entry: ["src/index.ts"]`는 root public entry에서만 package artifact를 만든다는 의미라고 설명한다.
- `format: ["esm", "cjs"]`는 현재 `package.json`의 `module`/`main` dual output 방향과 맞춘 설정이라고 설명한다.
- `dts: true`는 declaration output을 `tsdown`에 맡기는 설정이라고 설명한다.
- `clean: true`는 이전 `dist` 산출물이 남아 검증을 흐리지 않게 한다고 설명한다.
- `target: "es2022"`는 현재 TypeScript target과 build output target을 맞추기 위한 설정이라고 설명한다.
- `outExtensions`는 기존 `package.json`의 `module: "./dist/index.js"`와 `main: "./dist/index.cjs"`에 맞춰 ESM은 `.js`, CJS는 `.cjs`로 고정하기 위한 설정이라고 설명한다.
- `tsdown.config.ts`를 `tsconfig.json` include에 넣어 package typecheck 대상에 포함한다고 설명한다.

### 검증

```text
pnpm --filter @xelstack/chart build
```

기대:

- `packages/chart/dist/index.js`
- `packages/chart/dist/index.cjs`
- `packages/chart/dist/index.d.ts`

위 파일들이 생성된다.

## 단계 6: build output boundary 검증

### 사용자가 직접 작성

다음 명령을 실행한다.

```text
rg -n '@/|internal-types|normalize-config' packages/chart/dist
```

기대:

- 출력이 없어야 한다.
- `rg`는 match가 없으면 exit code 1을 반환할 수 있다. 이 경우는 이번 검증에서 성공으로 본다.

다음 파일을 확인한다.

```text
packages/chart/dist/index.d.ts
```

기대:

- public type만 export한다.
- `@/` alias가 남지 않는다.
- `internal-types`가 노출되지 않는다.
- `normalize-config`가 노출되지 않는다.

### Codex가 설명할 것

- `dist/index.d.ts`가 public type만 export하는지 확인한다.
- `@/` alias가 output에 남지 않는지 확인한다.
- `internal-types`와 `normalize-config`가 public declaration에 새지 않는지 확인한다.

### 검증

```text
pnpm --filter @xelstack/chart build
rg -n '@/|internal-types|normalize-config' packages/chart/dist
```

기대:

- build는 성공한다.
- `rg`는 아무 match도 출력하지 않는다.

## 단계 7: 전체 검증

### 사용자가 직접 작성

workspace root에서 다음 명령을 실행한다.

```text
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
pnpm --filter @xelstack/chart build
git diff --check
```

### Codex가 설명할 것

- 실패가 나면 실패 명령 하나만 먼저 분석한다.
- import order 실패는 Prettier config 또는 plugin install 상태를 먼저 본다.
- lint 실패는 self-import rule scope와 current imports를 먼저 본다.
- build 실패는 `tsdown.config.ts`, package exports, declaration output을 먼저 본다.

### 검증

기대:

- `pnpm typecheck` 통과
- `pnpm test` 통과
- `pnpm lint` 통과
- `pnpm format:check` 통과
- `pnpm --filter @xelstack/chart build` 통과
- `git diff --check` 통과

## 단계 8: 문서와 보고

### 사용자가 직접 작성

구현 결과에 따라 다음 문서를 갱신한다.

- `docs/hyper-waterfall/tech/task_m001_003_import_policy.md`
- `docs/hyper-waterfall/working/task_m001_003_stage1.md`

단계 완료보고는 다음 형태로 작성한다.

```md
# task_m001_003 단계 1 완료보고

## 계획

- import sort plugin 도입
- self-import 금지 rule 추가
- tsdown build 전환
- build output boundary 검증

## 완료

-

## 검증

-

## 계획 대비 차이

-

## 사용자 피드백

-

## 다음 게이트

- 상태: 대기
```

### Codex가 설명할 것

- 실제 변경이 계획과 다른 부분이 있으면 단계 완료보고에 남긴다.
- `tsup`에서 `tsdown`으로 전환한 이유를 최종 보고에도 남긴다.

### 검증

```text
pnpm exec prettier "docs/**/*.md" --check
git diff --check
```

기대:

- 문서 포맷과 diff 공백 검사가 통과한다.

## 승인

- 상태: 승인됨
- 승인자: user
- 날짜: 2026-06-24
