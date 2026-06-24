# task_m001_003 단계 1 완료보고

## 계획

이번 단계의 계획은 import policy와 module boundary tooling을 실제 repo 설정에 반영하는 것이었다.

계획된 범위:

- import sort plugin 도입
- self-import 금지 ESLint rule 추가
- `tsup`에서 `tsdown`으로 build tool 전환
- build output boundary 검증
- 구현 결과 기술 기록 반영

이번 단계에서 하지 않기로 한 것:

- `createChart` runtime API 구현
- input normalization 구현
- append buffer 구현
- renderer 구현
- scheduler 구현
- downsampling 구현
- public subpath export 추가
- browser global IIFE/UMD artifact 추가

## 완료

완료된 설정 변경:

- root devDependency에서 `tsup`을 제거했다.
- root devDependency에 `tsdown`을 추가했다.
- root devDependency에 `@ianvs/prettier-plugin-sort-imports`를 추가했다.
- `prettier.config.js`에 import 정렬 plugin과 import order 정책을 추가했다.
- 기존 source/test import를 plugin 결과에 맞춰 정렬했다.
- `eslint.config.js`에 `packages/chart/src/**` 내부 self-import 금지 rule을 추가했다.
- `packages/chart/tsdown.config.ts`를 추가했다.
- `packages/chart/package.json`의 `build` script를 `tsdown`으로 변경했다.
- `packages/chart/package.json`의 `format:check` script가 root `.prettierignore`를 사용하도록 조정했다.
- `packages/chart/tsconfig.json`의 typecheck 대상에 `tsdown.config.ts`를 포함했다.

완료된 정책:

- import order는 `side-effect -> external -> @/* -> relative`로 둔다.
- side-effect import끼리는 작성 순서를 보존한다.
- type import는 별도 group으로 분리하지 않는다.
- `packages/chart/src/**` 내부에서 `@xelstack/chart`, `@xelstack/chart/*` self-import를 금지한다.
- 현재 package build는 ESM/CJS만 지원한다.
- browser global IIFE/UMD build는 추후 별도 task로 넘긴다.

## 검증

다음 명령을 실행했고 통과했다.

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

생성된 주요 build output:

```text
packages/chart/dist/index.js
packages/chart/dist/index.cjs
packages/chart/dist/index.d.ts
packages/chart/dist/index.d.cts
```

boundary 검증:

```text
rg -n '@/|internal-types|normalize-config' packages/chart/dist
```

통과. `packages/chart/dist`에 `@/`, `internal-types`, `normalize-config`가 남지 않았다.

런타임 entry 로드 검증:

```text
node -e 'require("./packages/chart/dist/index.cjs"); console.log("cjs ok")'
node --input-type=module -e 'await import("./packages/chart/dist/index.js"); console.log("esm ok")'
```

통과.

## 계획 대비 차이

계획 대비 조정된 부분:

- `tsdown.config.ts`의 `outExtensions` callback에서는 `format === "esm"`이 아니라 `format === "es"`를 사용했다.
- 이유는 `tsdown` user config의 `"esm"`은 허용되지만, callback으로 들어오는 format은 Rolldown normalized value인 `"es"`이기 때문이다.
- `tsdown`은 dual ESM/CJS build에서 `index.d.cts`와 declaration source map도 함께 생성했다.
- 현재 public entry가 type-only라서 `index.cjs`는 0 bytes이고, `index.js`는 `export {};`만 가진다.
- generated `dist`가 package-level `prettier . --check`에 포함되어 format check가 실패했으므로, package script가 root `.prettierignore`를 명시하도록 조정했다.

계획대로 유지한 부분:

- `packages/chart/tsconfig.build.json`은 만들지 않았다.
- raw Rolldown은 직접 채택하지 않았다.
- public API contract test directory는 만들지 않았다.
- public runtime API는 추가하지 않았다.
- `src/index.ts`는 public type export만 유지했다.

## 사용자 피드백

이번 단계에서 반영된 사용자 판단:

- import sort plugin은 지금 도입한다.
- 순환참조가 최대한 일어나지 않는 방향으로 내부 import를 관리한다.
- `tsup` 대신 `tsdown`으로 간다.
- Node.js `22.18.0+` 이상의 build-time 요구사항은 받아들인다.
- browser global script build는 현재 task에서 하지 않고 추후 별도 지원으로 둔다.

## 남은 작업

이번 task의 남은 게이트:

- 최종보고서 작성
- 최종보고서 승인
- commit/push

후속 task 후보:

- browser global IIFE/UMD artifact 설계
- `createChart` runtime public API가 생긴 뒤 public API contract test 추가
- input normalization boundary 구현
- append buffer 구현

## 다음 게이트

- 상태: 승인됨
- 승인자: user
- 날짜: 2026-06-24
- 다음 게이트: 최종보고서 작성
