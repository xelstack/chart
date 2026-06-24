# task_m001_003 Import policy와 module boundary 기술 기록

## 발견

### 현재 코드의 import 상태

현재 `packages/chart`의 import는 세 가지 방식이 섞여 있다.

| 위치                                  | 현재 import 방식                                     | 의미                                                                    |
| ------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/config/normalize-config.ts`      | `@/domain/public-types`, `@/domain/internal-types`   | config 계층에서 domain 계층을 참조한다.                                 |
| `src/config/normalize-config.test.ts` | `@/config/normalize-config`, `@/domain/public-types` | internal behavior test가 내부 module을 직접 테스트한다.                 |
| `src/domain/internal-types.ts`        | `./public-types`                                     | 같은 domain directory 안의 가까운 type을 참조한다.                      |
| `src/domain/public-types.test.ts`     | `./public-types`                                     | colocated type test가 같은 파일군의 public type을 직접 검증한다.        |
| `src/index.ts`                        | `./domain/public-types`                              | package root public entry가 사용자에게 노출할 public type만 export한다. |
| `packages/chart/vitest.config.ts`     | `resolve.alias["@"] = ./src`                         | Vitest 실행 시 `@/*` alias를 runtime test resolver에 알려준다.          |
| `packages/chart/tsconfig.json`        | `paths["@/*"] = ["./src/*"]`                         | TypeScript와 editor에 source alias 해석 규칙을 알려준다.                |
| root `prettier.config.js`             | import sort plugin 없음                              | import 정렬은 현재 사람이 수동으로 한다.                                |
| root `eslint.config.js`               | boundary rule 없음                                   | self-import나 public/internal 경계 위반을 아직 검사하지 않는다.         |

### TypeScript `paths`의 책임

TypeScript `paths`는 import specifier를 TypeScript가 어떻게 해석할지 알려주는 설정이다. 현재 `@/* -> ./src/*`처럼 `baseUrl` 없이 명시 prefix를 넣은 것은 TypeScript 6 기준으로 맞는 방향이다.

TypeScript 6에서는 `baseUrl`이 deprecated이며, `paths` target에 `./src/*`처럼 prefix를 직접 넣는 방식을 권장한다.

중요한 점:

- `paths`는 typecheck와 editor module resolution을 위한 규칙이다.
- `paths`만으로 package boundary를 강제하지 못한다.
- `paths`만으로 build output의 import specifier가 안전하다고 보장할 수 없다.
- public API에 어떤 symbol을 노출할지는 `src/index.ts`와 `package.json#exports`가 결정한다.

### Vitest alias의 책임

Vitest는 Vite config를 사용하므로 test runtime에서 alias를 쓰려면 top-level `resolve.alias`가 필요하다.

현재 `packages/chart/vitest.config.ts`의 `@ -> ./src` 설정은 internal test가 `@/config/*`, `@/domain/*`를 import할 수 있게 한다.

중요한 점:

- Vitest alias는 test 실행을 위한 resolver 설정이다.
- TypeScript `paths`와 Vitest `resolve.alias`는 같은 의도를 가져야 하지만 서로 자동 동기화되지는 않는다.
- test가 public API contract를 검증하는지, internal behavior를 검증하는지에 따라 import 기준을 다르게 둬야 한다.

### tsup build의 현재 위험

현재 build script는 다음이다.

```text
tsup src/index.ts --format esm,cjs --dts
```

조사 중 다음 명령을 실행했다.

```text
pnpm --filter @xelstack/chart build
```

결과:

- ESM/CJS JS build는 시작되고 생성된다.
- `--dts` 단계에서 실패한다.
- 실패 메시지는 TypeScript 6의 `baseUrl` deprecation 에러다.
- repo의 tsconfig에는 `baseUrl`이 없으므로, 현재 증상은 `tsup --dts` 경로와 TypeScript 6 조합에서 드러나는 문제로 봐야 한다.

반대로 다음 명령은 통과했다.

```text
pnpm --filter @xelstack/chart exec tsc --noEmit
pnpm --filter @xelstack/chart exec tsc --emitDeclarationOnly --declaration --outDir dist-types
```

추가로 `tsc --emitDeclarationOnly`로 만든 조사용 declaration output에서는 internal declaration file에 `@/domain/*` alias가 남는 것을 확인했다.

예:

```ts
import type { ChartConfig } from "@/domain/public-types";
```

이 output은 public package artifact로 그대로 배포하면 안 된다.

따라서 build 완료 조건은 단순히 명령이 성공하는 것이 아니라, 다음을 함께 확인해야 한다.

- `pnpm --filter @xelstack/chart build`가 성공해야 한다.
- `packages/chart/dist/index.d.ts`가 public type만 노출해야 한다.
- publish output에 `@/` alias가 남지 않아야 한다.
- publish output에 `internal-types`가 public API로 새면 안 된다.

### ESLint boundary rule의 역할

ESLint의 `no-restricted-imports`는 특정 import를 금지하는 데 쓸 수 있다.

이번 task에서 가장 먼저 강제할 가치가 있는 것은 다음이다.

- `packages/chart/src/**`에서 `@xelstack/chart` self-import 금지
- public entry가 internal module을 부주의하게 export하지 못하도록 review checklist 또는 lint rule 추가

TypeScript 프로젝트에서는 `@typescript-eslint/no-restricted-imports`가 type-only import syntax까지 고려할 수 있으므로, rule을 도입한다면 base ESLint rule보다 이쪽이 더 적합하다.

### Prettier import sort plugin의 역할

Prettier는 plugin을 config에서 로드할 수 있다.

`@ianvs/prettier-plugin-sort-imports`는 import declaration을 정규식 기반 순서로 정렬하고, side-effect import 순서를 기본적으로 보존하는 plugin이다. 또한 type import grouping, alias grouping, import source merge 등을 지원한다.

하지만 import sort plugin은 단순 포맷 옵션이 아니라 다음을 동반한다.

- dependency 추가
- lockfile 변경
- 기존 import diff 재정렬
- side-effect import 순서 정책 결정
- type import와 value import를 같은 group에 둘지 분리할지 결정

현재 파일 수와 import 수가 적을 때 import sort plugin을 도입하는 편이 맞다. 파일이 많아진 뒤 import formatter를 도입하면 실제 기능 변경과 무관한 import 재정렬 diff가 대량으로 발생한다.

따라서 이번 task에서 import sort plugin 도입은 확정한다. 다만 세부 import group/order, side-effect import 정책, type import 분리 여부는 구현계획서에서 결정한다.

## 근거

### 로컬 조사 근거

조사 기준일: 2026-06-24

확인한 파일:

- `package.json`
- `packages/chart/package.json`
- `tsconfig.base.json`
- `packages/chart/tsconfig.json`
- `packages/chart/vitest.config.ts`
- `eslint.config.js`
- `prettier.config.js`
- `packages/chart/src/index.ts`
- `packages/chart/src/config/normalize-config.ts`
- `packages/chart/src/config/normalize-config.test.ts`
- `packages/chart/src/domain/internal-types.ts`
- `packages/chart/src/domain/public-types.test.ts`

실행한 명령:

```text
rg -n "^import |^export .* from|@/|@xelstack/chart|\\.\\./|\\./" packages/chart . --glob '!node_modules' --glob '!dist'
pnpm --filter @xelstack/chart build
pnpm --filter @xelstack/chart exec tsc --noEmit
pnpm --filter @xelstack/chart exec tsc --emitDeclarationOnly --declaration --outDir dist-types
```

결과 요약:

- TypeScript typecheck는 통과했다.
- TypeScript declaration-only emit은 통과했다.
- `tsup --dts` build는 실패했다.
- declaration-only emit에는 internal declaration file의 `@/` alias가 남았다.
- 조사용 생성물 `packages/chart/dist`와 `packages/chart/dist-types`는 삭제했다.

### 외부 문서 근거

- [TypeScript 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html): `baseUrl` deprecation과 `paths` target에 prefix를 명시하는 방식.
- [TypeScript TSConfig `paths`](https://www.typescriptlang.org/tsconfig/paths.html): `paths`가 import lookup location을 remap하는 설정이라는 점.
- [TypeScript Modules Theory](https://www.typescriptlang.org/docs/handbook/modules/theory.html): `moduleResolution: "bundler"`가 bundler 대상 module resolution mode라는 점.
- [Vitest config](https://vitest.dev/config/): Vitest가 Vite config를 사용하고 alias는 top-level `resolve.alias`로 둬야 한다는 점.
- [ESLint `no-restricted-imports`](https://eslint.org/docs/latest/rules/no-restricted-imports): 특정 static import 금지에 사용할 수 있다는 점.
- [typescript-eslint `no-restricted-imports`](https://typescript-eslint.io/rules/no-restricted-imports/): TypeScript type import syntax까지 고려하는 extension rule이라는 점.
- [Prettier plugins](https://prettier.io/docs/plugins): Prettier plugin은 config에서 명시적으로 로드할 수 있다는 점.
- [@ianvs/prettier-plugin-sort-imports](https://github.com/ianvs/prettier-plugin-sort-imports): import 정렬, side-effect import 보존, type import grouping, alias grouping 지원.
- [tsup GitHub README](https://github.com/egoist/tsup): tsup이 TypeScript library bundler이며 현재 upstream README에서 actively maintained 상태가 아님을 알리고 있다는 점.
- [Rolldown](https://rolldown.rs/): Rolldown은 Rust 기반 bundler이며 Rollup-compatible API와 esbuild feature parity를 목표로 한다는 점.
- [Rolldown Getting Started](https://rolldown.rs/guide/getting-started): Rolldown 공식 문서가 library bundling use case에는 `tsdown`을 보라고 안내한다는 점.
- [tsdown dts](https://tsdown.dev/options/dts): `tsdown`이 declaration file 생성을 지원하며 `dts: true` 또는 `--dts`로 활성화할 수 있다는 점.
- [tsdown output format](https://tsdown.dev/options/output-format): `tsdown`이 ESM/CJS 등 여러 output format을 지원한다는 점.
- `.agents/skills/tsdown/SKILL.md`: 프로젝트에 추가된 tsdown 스킬. Node.js `22.18.0+` build-time 요구사항, 기본 library build 설정, tsup migration 관점, d.ts 생성 옵션을 확인했다.

## 결정

이 문서는 초안이며, 아래 결정은 구현계획서 작성 전에 사용자가 검토할 수 있다.

### 결정 1: `@/*`는 package-local internal source alias로 둔다

`@/*`는 `packages/chart/src/*` 내부 구현을 읽기 쉽게 만들기 위한 source alias다.

허용:

```ts
import { normalizeConfig } from "@/config/normalize-config";
import type { ChartConfig } from "@/domain/public-types";
```

금지:

```ts
import { createChart } from "@xelstack/chart";
```

이유:

- `@/*`는 source tree 안에서만 의미가 있다.
- `@xelstack/chart`는 사용자-facing package name이다.
- package 내부 구현이 자기 자신의 public package entry를 import하면 public/internal boundary가 흐려진다.

### 결정 2: 같은 directory의 가까운 import는 relative를 허용한다

같은 directory 안에서 강하게 묶인 파일은 `./` relative import를 허용한다.

예:

```ts
import type { ChartType, InitialDataInput } from "./public-types";
```

이유:

- 같은 domain 파일군의 관계가 더 직접적으로 보인다.
- 모든 import를 alias로 강제하면 local cohesion이 오히려 흐려질 수 있다.
- 현재 `public-types.test.ts`의 colocated type test 의도와도 맞다.

초안 규칙:

- cross-directory internal import: `@/*` 권장
- same-directory colocated import: `./*` 허용
- parent traversal `../*`: 가능한 한 피하고, 필요하면 이유를 검토한다.

### 결정 3: `src/index.ts`는 public entry로 취급하고 alias 사용을 제한한다

`src/index.ts`는 internal module이 아니라 package public contract다.

초안 규칙:

- `src/index.ts`에서는 `@/*` alias를 쓰지 않는다.
- `src/index.ts`에서는 public으로 노출할 symbol만 export한다.
- `internal-types`, `normalize-config`, runtime internals는 root public entry로 export하지 않는다.
- 현재처럼 `./domain/public-types`에서 public type만 export하는 형태는 허용한다.

이유:

- root entry는 사용자가 보는 API 표면이다.
- internal model은 성능 최적화에 맞춰 자유롭게 바뀌어야 한다.
- internal type이 public API로 새면 이후 최적화가 어려워진다.

### 결정 4: test import는 목적에 따라 나눈다

초안 규칙:

- internal behavior test는 internal module을 직접 import할 수 있다.
- colocated domain type test는 `./public-types`처럼 가까운 relative import를 쓸 수 있다.
- future public API contract test는 runtime public API가 생긴 뒤 package entry 기준으로 작성한다.
- 단순 re-export smoke test는 아직 만들지 않는다.

예:

```ts
import { normalizeConfig } from "@/config/normalize-config";
import type { ChartConfig } from "@/domain/public-types";
```

이 import는 `normalizeConfig`라는 internal boundary function을 직접 테스트하므로 허용한다.

### 결정 5: self-import 금지는 ESLint로 강제할 수 있다

구현계획서에서 lint rule을 추가한다면 첫 번째 후보는 다음이다.

- `@typescript-eslint/no-restricted-imports`

금지 후보:

```text
@xelstack/chart
@xelstack/chart/*
```

적용 후보:

```text
packages/chart/src/**/*.{ts,tsx}
```

주의:

- public package contract test가 생기면 예외 directory가 필요할 수 있다.
- 이번 task에서 broad lint architecture rule을 많이 추가하지 않는다.

### 결정 6: import order는 네 개 group으로 고정한다

사용자는 import group/order를 다음 순서로 결정했다.

```text
side-effect import
external package import
@/* internal alias import
relative import
```

예:

```ts
import "some-polyfill";

import { describe, expect, it } from "vitest";
import type { UserConfig } from "vitest/config";

import { normalizeConfig } from "@/config/normalize-config";
import type { ChartConfig } from "@/domain/public-types";

import { localHelper } from "./local-helper";
import type { LocalType } from "./local-types";
```

side-effect import는 최상단에 두며, side-effect import끼리는 작성 순서를 보존한다. 이는 실행 순서를 바꾸면 polyfill, global setup, CSS cascade 같은 동작이 바뀔 수 있기 때문이다.

type import는 value import와 별도 group으로 분리하지 않는다. `import type` 문법 자체로 타입 import가 드러나므로, 같은 source group 안에서 value import와 함께 둔다.

### 결정 7: import sort plugin은 이번 task에서 도입한다

사용자는 import sort plugin을 이번 task에서 도입하는 방향으로 결정했다.

결정 이유:

- import 정렬은 프로젝트 초기에 고정해야 한다.
- 파일 수가 늘어난 뒤 import formatter를 도입하면 포맷팅만으로 많은 파일 diff가 발생한다.
- import 순서가 사람마다 흔들리면 code review에서 의미 없는 잡음이 생긴다.
- 지금 도입하면 앞으로 생성되는 파일이 처음부터 같은 규칙을 따른다.

구현계획서에 포함할 것:

- `@ianvs/prettier-plugin-sort-imports` 설치
- root Prettier config에 plugin 설정 추가
- import order 규칙 정의
- 현재 source/test/config import 재정렬
- `pnpm-lock.yaml` 변경
- `pnpm format:check`로 자동 정렬 정책 검증

plugin 세부 설정:

- Prettier root config에서 plugin을 로드한다.
- `side-effect -> external package -> @/* internal alias -> relative` 순서를 적용한다.
- type import는 별도 `<TYPES>` group으로 분리하지 않는다.
- side-effect import는 plugin 기본 동작처럼 정렬 이동을 허용하지 않는다.
- `@/*` alias는 scoped npm package와 섞이지 않도록 별도 group으로 둔다.

### 결정 8: self-import 금지는 ESLint로 바로 강제한다

사용자는 순환참조가 최대한 일어나지 않는 방향으로 코딩해야 한다고 판단했다.

따라서 이번 task에서 다음 import를 `packages/chart/src/**` 내부에서 금지한다.

```ts
import { createChart, type ChartConfig } from "@xelstack/chart";
```

금지 이유:

- 내부 구현이 public entry를 거치면 순환참조 위험이 커진다.
- public API와 internal module boundary가 섞인다.
- scheduler, renderer, buffer 계층이 생긴 뒤 순환 구조가 숨어들기 쉽다.
- 성능 라이브러리는 dependency 방향이 명확해야 hot path 추적이 쉽다.

### 결정 9: build tool은 tsdown으로 전환한다

현재 `pnpm --filter @xelstack/chart build`는 `tsup --dts` 단계에서 실패한다.

초기에 검토한 대안은 `tsup`을 유지하고 JS bundle은 `tsup`, declaration emit은 `tsc -p packages/chart/tsconfig.build.json`로 분리하는 방식이었다.

하지만 사용자는 Rolldown도 고려한 뒤, raw Rolldown을 직접 쓰기보다 library bundler인 `tsdown`으로 전환하기로 결정했다.

결정 이유:

- `tsup`은 upstream README에서 actively maintained 상태가 아니며 `tsdown`을 고려하라고 안내한다.
- Rolldown 공식 문서는 library bundling use case에 `tsdown`을 안내한다.
- `tsdown`은 Rolldown 기반 library bundler이며 d.ts 생성을 직접 지원한다.
- `tsdown`을 쓰면 `tsup + tsc + tsconfig.build.json`으로 책임을 나누지 않아도 된다.
- 사용자는 추후에도 Node.js `22.18.0+` 이상을 지원할 가능성이 높다고 판단했으므로 `tsdown`의 build-time Node.js 요구사항은 문제가 되지 않는다.

구현 방향:

- root devDependency에서 `tsup`을 제거한다.
- root devDependency에 `tsdown`을 추가한다.
- `packages/chart/tsdown.config.ts`를 만든다.
- `packages/chart/package.json`의 `build` script를 `tsdown`으로 바꾼다.
- `packages/chart/tsconfig.build.json`은 만들지 않는다.
- raw Rolldown은 직접 채택하지 않는다.
- `tsdown.config.ts`는 `.agents/skills/tsdown/SKILL.md`와 관련 reference를 기준으로 작성한다.
- 기존 package field와 맞추기 위해 ESM output은 `.js`, CJS output은 `.cjs`로 고정한다.

### 결정 10: build 검증은 이번 task의 완료 조건에 포함한다

`tsdown` 전환 뒤에도 build 완료 조건은 단순 성공이 아니라 output boundary 검증까지 포함한다.

검증 후보:

```text
pnpm --filter @xelstack/chart typecheck
pnpm --filter @xelstack/chart test
pnpm --filter @xelstack/chart lint
pnpm --filter @xelstack/chart format:check
pnpm --filter @xelstack/chart build
rg -n '"@/|internal-types|normalize-config"' packages/chart/dist
git diff --check
```

완료 조건:

- build가 성공한다.
- public declaration output에 internal alias가 남지 않는다.
- public declaration output에 internal module이 노출되지 않는다.
- self-import 금지 정책이 문서 또는 lint rule로 관리된다.

### 결정 11: public API contract test directory는 아직 만들지 않는다

사용자는 public API contract test directory를 지금 만들지 않고, `createChart` runtime public API가 생긴 뒤 추가하기로 결정했다.

이유:

- 현재 root public entry는 type export 중심이다.
- 지금 public API contract test directory를 만들면 의미가 약한 구조만 먼저 생긴다.
- 이전에 단순 re-export smoke test를 과하다고 판단한 흐름과 일관된다.

## 구현 결과

### import sort plugin 적용 결과

root `prettier.config.js`에 `@ianvs/prettier-plugin-sort-imports`를 추가했다.

적용한 import group은 다음이다.

```text
side-effect import
external package import
@/* internal alias import
relative import
```

type import는 별도 `<TYPES>` group으로 분리하지 않는다. 따라서 value import와 type import는 같은 source group 안에서 정렬된다.

적용 후 대표 결과:

```ts
import { describe, expect, it } from "vitest";

import { normalizeConfig } from "@/config/normalize-config";
import type { ChartConfig } from "@/domain/public-types";
```

### self-import 금지 rule 적용 결과

`eslint.config.js`에 `packages/chart/src/**/*.{ts,tsx}` 범위의 self-import 금지 rule을 추가했다.

금지 대상:

```text
@xelstack/chart
@xelstack/chart/*
```

사용자가 `packages/chart/src/**`에 다음 import를 직접 넣어 ESLint 경고가 발생하는 것을 확인했다.

```ts
import { something } from "@xelstack/chart";
```

정상 상태에서는 `pnpm lint`가 통과한다.

### tsdown 전환 결과

`packages/chart`의 build script를 `tsup`에서 `tsdown`으로 전환했다.

현재 설정:

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "es2022",
  outExtensions: ({ format }) => ({
    js: format === "es" ? ".js" : ".cjs",
  }),
});
```

주의할 점:

- `format: ["esm", "cjs"]`의 `"esm"`은 user config 입력값으로 허용된다.
- `outExtensions` callback의 `format`은 normalized value라서 ESM일 때 `"esm"`이 아니라 `"es"`로 들어온다.
- 따라서 `outExtensions` 안에서는 `format === "es"`를 사용해야 TypeScript 검사를 통과한다.

build 결과:

```text
packages/chart/dist/index.js
packages/chart/dist/index.cjs
packages/chart/dist/index.d.ts
packages/chart/dist/index.d.ts.map
packages/chart/dist/index.d.cts
packages/chart/dist/index.d.cts.map
```

현재 `src/index.ts`가 type-only public entry라서 `index.cjs`는 0 bytes이고, `index.js`는 `export {};`만 가진다. 이는 현재 runtime export가 없기 때문에 정상으로 본다.

### package format check 조정

`tsdown` build 뒤 `packages/chart/dist/index.d.ts`와 `packages/chart/dist/index.d.cts`가 생성되면서 package-level `prettier . --check`가 generated output을 검사했다.

root `.prettierignore`에는 이미 `dist`가 있지만, `pnpm -r format:check`는 `packages/chart` cwd에서 package script를 실행하므로 root ignore가 자동 적용되지 않았다.

따라서 `packages/chart/package.json`의 `format:check` script를 다음처럼 조정했다.

```text
prettier . --check --ignore-path ../../.prettierignore
```

이 설정은 generated `dist`를 포맷 대상에서 제외하고, source/config/test 파일만 format policy 대상으로 유지한다.

### 브라우저 글로벌 빌드

현재 task에서는 ESM/CJS package build만 지원한다.

지원:

- npm/번들러 ESM import
- CommonJS require

보류:

- `<script src="..."></script>` 기반 browser global build
- IIFE/UMD output
- global name 예: `XelChart`
- minified/unminified global artifact 전략
- CDN 사용 예시

브라우저 글로벌 빌드는 `createChart` runtime API가 생긴 뒤 별도 task로 다룬다.

### build output boundary 검증 결과

다음 명령으로 publish output에 내부 alias와 internal module 이름이 새지 않는지 확인했다.

```text
rg -n '@/|internal-types|normalize-config' packages/chart/dist
```

결과:

```text
no boundary leaks
```

`packages/chart/dist/index.d.ts`는 public type만 포함한다.

## 구현계획서로 넘길 질문

구현계획서를 작성하기 전에 사용자가 결정하면 좋은 것은 다음이다.

1. `tsup`을 제거하고 `tsdown`을 추가하는 build tool 변경을 구현계획서 범위로 승인할 것인가?
2. import policy를 `docs/hyper-waterfall/tech/task_m001_003_import_policy.md`에 유지할 것인가, 별도 project policy 문서로 분리할 것인가?

초안 권장 답변:

1. `tsup`을 제거하고 `tsdown`을 추가하는 build tool 변경을 이번 task 범위로 승인한다.
2. import policy는 이번 task에서는 기술 기록에 유지하고, 파일 수가 늘어나면 별도 project policy 문서로 분리한다.

## 다시 볼 시점

다음 시점에 이 기록을 다시 본다.

- `task_m001_003` 구현계획서 작성 직전
- `createChart` public runtime API가 생기는 시점
- `append`/buffer/renderer 계층이 생겨 internal import가 늘어나는 시점
- package publish 전
- `tsdown` output format이나 package export 전략을 바꾸는 시점
- browser global 또는 CDN 배포 artifact를 추가하는 시점
