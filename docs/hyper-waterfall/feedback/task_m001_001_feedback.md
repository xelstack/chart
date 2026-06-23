# task_m001_001 피드백

## 2026-06-21

### 사용자 피드백

사용자는 수행계획서의 package manager 결정에 대해 먼저 `pnpm`을 사용할 것이라고 정했다.

### 결정

`task_m001_001`의 package manager는 `pnpm`으로 한다.

### 영향

- lockfile은 `package-lock.json`이 아니라 `pnpm-lock.yaml`을 사용한다.
- 검증 명령은 `npm run typecheck`, `npm test`, `npm run lint`가 아니라 `pnpm typecheck`, `pnpm test`, `pnpm lint`를 기준으로 한다.
- 이후 구현계획서에서는 `pnpm` 기반 설치와 script 실행 순서를 사용한다.

## 2026-06-21

### 사용자 피드백

사용자는 `pnpm` workspace를 잘 활용할 수 있는 구조를 원한다고 했다.

### 결정

repository root는 workspace orchestration package로 두고, 실제 chart library code는 `packages/chart` workspace package 안에 둔다.

### 영향

- root에는 `pnpm-workspace.yaml`을 둔다.
- root `package.json`은 private workspace orchestration 역할을 한다.
- publish 대상 library package는 `packages/chart`에 둔다.
- 초기 코드는 `packages/chart/src`에 둔다.
- 초기 unit/domain 테스트는 source 옆에 colocated test로 둔다.
- root quality gate는 workspace scripts를 실행하도록 설계한다.

## 2026-06-22

### 사용자 피드백

사용자는 TypeScript 버전을 고정된 과거 버전이 아니라 최신 버전으로 가자고 했다.

### 결정

TypeScript는 2026-06-22 기준 npm registry의 `typescript/latest`에서 확인한 `6.0.3`을 사용한다.

### 영향

- 수행계획서의 이전 TypeScript 고정 버전 기준을 제거한다.
- 구현 시 package manifest에는 `typescript@6.0.3`을 명시한다.
- 주변 도구가 최신 TypeScript와 충돌하면 troubleshooting 문서에 기록하고 선택지를 다시 판단한다.

## 2026-06-22

### 사용자 피드백

사용자는 이번 범위에서 도메인 주도 설계를 위한 함수형 프로그래밍 기법을 넣는 것은 제외하는 게 좋을지 물었고, 이번 task에서는 제외하자는 판단에 동의했다.

### 결정

`task_m001_001`에서는 DDD/FP 구현 패턴을 도입하지 않는다.

### 영향

- 이번 task는 pnpm workspace, TypeScript, lint/test/build, package boundary, 첫 public type 파일 위치까지만 다룬다.
- `Result`, ADT, railway-oriented programming, branded type, 함수형 라이브러리 도입은 이번 task의 범위 밖으로 둔다.
- 다음 domain type task에서 가벼운 `functional core, imperative shell` 원칙과 hot path 성능 비용을 함께 검토한다.

## 2026-06-22

### 사용자 피드백

사용자는 lint rule은 개발하면서 생성된 코드를 보고 더 추가하고, Prettier도 넣자고 했다. formatting 기준은 세미콜론을 사용하고 탭 간격은 2로 정했다.

### 결정

초기 lint는 최소 규칙으로 시작하고, formatting은 Prettier로 고정한다.

### 영향

- `task_m001_001`에 Prettier 설정을 포함한다.
- Prettier 초기 설정은 `semi: true`, `tabWidth: 2`, `useTabs: false`로 한다.
- root quality gate에 `pnpm format:check`를 추가한다.
- 세부 ESLint rule은 실제 작성되는 코드를 보며 필요할 때 추가한다.

## 2026-06-22

### 사용자 피드백

사용자는 `.prettierrc.json` 대신 JavaScript config를 쓰면 안 되는지 물었고, JS와 CJS 중 어떤 형식이 적절한지도 다른 라이브러리 사례를 확인해 달라고 했다.

### 결정

Prettier config는 root `prettier.config.js`를 사용한다.

### 영향

- 구현계획서의 `.prettierrc.json` 항목을 `prettier.config.js`로 바꾼다.
- root `package.json`에 `"type": "module"`이 있으므로 `prettier.config.js`는 ESM config로 작성한다.
- config는 `export default config` 형태를 사용한다.
- CommonJS가 반드시 필요한 상황이 생길 때만 `prettier.config.cjs`로 바꾼다.

## 2026-06-22

### 사용자 피드백

사용자는 테스트를 별도 `tests/` 폴더가 아니라 해당 영역 옆에 둘 수 없는지 물었고, domain test는 domain source 옆에 두는 방향을 선호했다.

### 결정

초기 unit/domain test는 colocated test로 둔다.

### 영향

- `packages/chart/tests/domain/public-types.test.ts` 대신 `packages/chart/src/domain/public-types.test.ts`를 사용한다.
- `vitest.config.ts`의 include는 `src/**/*.test.ts`로 둔다.
- 별도 `tests/` 디렉터리는 integration/API contract test가 필요해질 때 다시 도입한다.

## 2026-06-22

### 사용자 피드백

사용자는 colocated `public-types.test.ts`에서 `import type {} from "./public-types"`처럼 같은 domain module에서 type을 가져오는 것이 더 맞지 않느냐고 물었고, type을 가져와 테스트하는 것이 의미 있는 unit test인지 깊게 확인해 달라고 했다.

### 결정

`public-types.test.ts`는 runtime unit test가 아니라 domain type contract test로 취급한다.

### 영향

- colocated domain type test는 `./public-types`에서 type을 직접 import한다.
- 빈 `import type {}`는 의미가 없으므로 실제 사용하는 type 이름을 명시한다.
- public package entry export 검증은 별도 public API contract test로 나중에 분리한다.
- type-only module에 runtime `expect(...)`만 붙이는 테스트는 낮은 신호로 본다.
- type contract 검증은 `expectTypeOf`, `assertType`, `tsc --noEmit` 조합으로 한다.
