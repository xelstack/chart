# task_m001_003 최종보고서

## 목표

`task_m001_003`의 목표는 `@/*` alias 도입 이후 흐려질 수 있는 import policy와 module boundary를 repo tooling으로 고정하는 것이었다.

이번 task는 runtime feature를 추가하지 않고, 앞으로 config, input normalization, buffer, renderer, scheduler 계층이 늘어나도 public/internal boundary와 import order가 흔들리지 않도록 초기 기준을 잡는 작업이었다.

## 결과

완료된 결과:

- `@ianvs/prettier-plugin-sort-imports`를 root devDependency로 추가했다.
- root `prettier.config.js`에 import order 정책을 추가했다.
- import order를 `side-effect -> external -> @/* -> relative`로 고정했다.
- type import는 별도 group으로 분리하지 않고 같은 source group 안에 두기로 했다.
- 기존 source/test import를 plugin 결과에 맞춰 정렬했다.
- `eslint.config.js`에 `packages/chart/src/**` 내부 self-import 금지 rule을 추가했다.
- `@xelstack/chart`, `@xelstack/chart/*`를 package source 내부에서 금지했다.
- `tsup`을 제거하고 `tsdown`을 root devDependency로 추가했다.
- `packages/chart/tsdown.config.ts`를 추가했다.
- `packages/chart/package.json`의 `build` script를 `tsdown`으로 변경했다.
- `packages/chart/tsconfig.json`의 typecheck 대상에 `tsdown.config.ts`를 포함했다.
- package-level `format:check`가 root `.prettierignore`를 사용하도록 조정했다.
- build output boundary 검증을 완료 조건에 포함했다.
- browser global IIFE/UMD build는 이번 task에서 제외하고 후속 task로 남겼다.

현재 package build 결과:

```text
packages/chart/dist/index.js
packages/chart/dist/index.cjs
packages/chart/dist/index.d.ts
packages/chart/dist/index.d.ts.map
packages/chart/dist/index.d.cts
packages/chart/dist/index.d.cts.map
```

현재 `src/index.ts`는 type-only public entry이므로 `index.cjs`는 0 bytes이고, `index.js`는 `export {};`만 가진다. 이는 이번 task 범위에서는 정상이다.

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
pnpm --filter @xelstack/chart build
```

통과.

build output boundary 검증:

```text
rg -n '@/|internal-types|normalize-config' packages/chart/dist
```

통과. `packages/chart/dist`에 `@/`, `internal-types`, `normalize-config`가 남지 않았다.

ESM/CJS entry 로드 검증:

```text
node -e 'require("./packages/chart/dist/index.cjs"); console.log("cjs ok")'
node --input-type=module -e 'await import("./packages/chart/dist/index.js"); console.log("esm ok")'
```

통과.

문서와 공백 검증:

```text
pnpm exec prettier "docs/**/*.md" --check
```

통과.

```text
git diff --check
```

통과.

## 계획 대비 실제

계획대로 완료:

- import sort plugin을 이번 task에서 도입했다.
- side-effect import 순서 보존 정책을 유지했다.
- type import를 별도 `<TYPES>` group으로 분리하지 않았다.
- self-import 금지를 ESLint rule로 강제했다.
- `tsup` 대신 `tsdown`으로 build tool을 전환했다.
- `packages/chart/tsconfig.build.json`은 만들지 않았다.
- raw Rolldown은 직접 채택하지 않았다.
- build output boundary 검증을 완료 조건에 포함했다.
- public API contract test directory는 만들지 않았다.
- runtime public API는 추가하지 않았다.

계획에서 조정된 부분:

- `tsdown.config.ts`의 `outExtensions` callback에서는 `format === "esm"`이 아니라 `format === "es"`를 사용했다.
- 이유는 `format: ["esm", "cjs"]`의 `"esm"`은 user config 입력값으로 허용되지만, callback으로 들어오는 format은 Rolldown normalized value인 `"es"`이기 때문이다.
- `tsdown`은 dual ESM/CJS build에서 `index.d.cts`와 declaration source map도 함께 생성했다.
- generated `dist`가 package-level `prettier . --check`에 포함되어 format check가 실패했으므로, package script가 root `.prettierignore`를 명시하도록 조정했다.
- 브라우저 `<script src>` global build는 현재 task가 아니라 후속 task로 넘겼다.

## 남은 작업

다음 task 후보:

```text
task_m001_004
```

추천 목표:

```text
input normalization boundary
```

다음 task에서 다룰 것:

- `PointObject`, `PointTuple`, `ColumnarPointBatch`를 내부 입력 표현으로 변환하는 boundary를 만든다.
- `Date`를 epoch milliseconds로 변환하는 위치를 확정한다.
- `null`을 gap encoding으로 다루는 정책을 구현한다.
- typed-array input path가 불필요하게 느려지지 않도록 테스트 기준을 세운다.
- `normalizeConfig` 이후 runtime creation flow로 넘어가기 위한 입력 전처리 경계를 만든다.

후속 task 후보:

- `createChart` runtime public API skeleton
- append buffer 구현
- RAF scheduler 구현
- line/area renderer skeleton
- browser global IIFE/UMD artifact 설계
- `createChart` runtime API 이후 public API contract test 추가

## 배운 점

- import policy는 취향 문제가 아니라 public/internal boundary, 순환참조 방지, build output 안전성과 연결된다.
- package 내부에서 자기 public entry인 `@xelstack/chart`를 import하지 못하게 막는 것은 이후 계층이 늘어날수록 중요해진다.
- import sort plugin은 파일이 적은 초기에 도입하는 편이 review noise를 줄인다.
- `tsdown`의 user config format과 callback normalized format은 다를 수 있다.
- build 성공만으로는 충분하지 않고, declaration output에 internal alias나 internal module이 새지 않는지 확인해야 한다.
- generated output은 formatting 대상에서 제외해야 한다.
- 현재 ESM/CJS package build와 browser global script build는 별도 배포 전략으로 다루는 편이 명확하다.

## 승인

- 상태: 승인됨
- 승인자: user
- 날짜: 2026-06-24
