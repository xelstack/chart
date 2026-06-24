# task_m001_003 피드백

## 2026-06-24

### 사용자 피드백

사용자는 import sort plugin을 도입하는 방향으로 가야 한다고 판단했다.

이유는 다음이다.

- 지금 해놔야 나중에 편하다.
- 파일이 많아진 뒤 import formatting을 도입하면 파일 변경사항이 많아진다.
- import 정렬은 프로젝트 초기에 고정하는 편이 낫다.

### 결정

- `@ianvs/prettier-plugin-sort-imports` 도입을 이번 task의 구현계획 범위에 포함한다.
- plugin 설치 여부는 더 이상 미결정 사항으로 두지 않는다.
- 세부 import group/order, side-effect import 정책, type import 분리 여부는 구현계획서에서 결정한다.

### 영향

- `task_m001_003` 기술 기록의 import sort plugin 판단을 “선택지”에서 “도입 확정”으로 바꾼다.
- 구현계획서에는 dependency 추가, Prettier config 변경, lockfile 변경, 기존 import 재정렬, format 검증 단계를 포함해야 한다.
- 이후 파일이 늘어나도 import formatter 도입으로 인한 대규모 노이즈 diff를 피할 수 있다.

## 2026-06-24 구현계획 전 결정

### 사용자 피드백

사용자는 구현계획서 작성 전에 다음 결정을 확정했다.

- import group/order는 `side-effect -> external package -> @/* internal alias -> relative` 순서로 간다.
- side-effect import는 최상단에 두고, side-effect import끼리는 작성 순서를 보존한다.
- type import는 별도 group으로 분리하지 않고 value import와 같은 source group 안에 둔다.
- 순환참조가 최대한 일어나지 않는 방향으로 코딩해야 한다.
- `tsup --dts` 실패는 이번 task에서 해결하고 build output 검증까지 완료 조건에 넣는다.
- public API contract test directory는 지금 만들지 않고, `createChart` runtime public API가 생긴 뒤 추가한다.

### 결정

- Prettier import order는 `side-effect -> external package -> @/* -> relative`로 설정한다.
- `@ianvs/prettier-plugin-sort-imports`의 type import 분리 기능은 사용하지 않는다.
- `@xelstack/chart`, `@xelstack/chart/*` self-import는 `packages/chart/src/**` 내부에서 ESLint로 금지한다.
- build는 처음에는 JS bundle과 declaration emit을 분리하는 방향으로 검토했다.
- public API contract test 구조는 후속 task로 넘긴다.

### 영향

- 이 시점의 build 분리 판단은 이후 `tsdown` 전환 결정으로 대체되었다.
- 구현계획서에는 `prettier.config.js`, `eslint.config.js`, `packages/chart/package.json`, `packages/chart/tsdown.config.ts`, `pnpm-lock.yaml` 변경을 포함한다.
- 구현 단계에서는 runtime behavior를 바꾸지 않고 tooling과 import boundary만 바꾼다.

## 2026-06-24 build tool 결정 변경

### 사용자 피드백

사용자는 `tsup`을 유지하면서 `tsconfig.build.json`을 추가하는 방향 대신 `tsdown`으로 가기로 결정했다.

판단은 다음을 바탕으로 한다.

- Rolldown도 고려했지만, raw Rolldown보다 library bundling용 wrapper인 `tsdown`이 현재 목적에 더 맞다.
- `tsdown`은 build-time Node.js `22.18.0+`를 요구하지만, 이 프로젝트는 추후에도 Node.js `22.18.0+` 이상을 지원할 가능성이 높으므로 문제가 되지 않는다.

### 결정

- `tsup`은 제거한다.
- `tsdown`을 root devDependency로 추가한다.
- `packages/chart/tsconfig.build.json`은 만들지 않는다.
- `packages/chart/tsdown.config.ts`를 만든다.
- `packages/chart/package.json`의 `build` script는 `tsdown`으로 단순화한다.

### 영향

- 구현계획서의 build 단계는 `tsup + tsc declaration emit 분리`에서 `tsdown 단일 build 설정`으로 바뀐다.
- 수행계획서에 기술 조사 후 추가된 범위도 `tsconfig.build.json`이 아니라 `tsdown.config.ts`로 수정한다.
- build output boundary 검증은 그대로 유지한다.

## 2026-06-24 tsdown 스킬 추가

### 사용자 피드백

사용자는 프로젝트에 tsdown 관련 스킬을 추가했다.

추가된 위치:

- `.agents/skills/tsdown/SKILL.md`

### 결정

- `task_m001_003` 구현 전에 `.agents/skills/tsdown/SKILL.md`를 읽는다.
- 구현계획서의 `tsdown.config.ts` 예시는 해당 스킬의 기본 configuration pattern을 따른다.
- package field와 맞추기 위해 `outExtensions`로 ESM `.js`, CJS `.cjs` output을 명시한다.

### 영향

- 구현계획서에 tsdown 스킬과 주요 reference를 명시한다.
- `tsdown.config.ts` 초안은 `entry: ["src/index.ts"]`, `format: ["esm", "cjs"]`, `dts: true`, `clean: true`를 기준으로 한다.

## 2026-06-24 Hyper-Waterfall 스킬 위치 정리

### 사용자 피드백

사용자는 Hyper-Waterfall에서 만든 프로젝트 스킬도 `.agents/skills/`로 옮길 필요가 있는지 물었고, Codex에게 직접 옮기라고 요청했다.

### 결정

- Hyper-Waterfall 스킬의 위치를 `docs/hyper-waterfall/skills/xel-chart-hyper-waterfall/SKILL.md`에서 `.agents/skills/xel-chart-hyper-waterfall/SKILL.md`로 옮긴다.
- `docs/hyper-waterfall/`은 작업 기록과 결정 문서만 보관한다.
- `.agents/skills/`는 프로젝트 로컬 agent skill의 단일 위치로 사용한다.

### 영향

- `AGENTS.md`의 필수 스킬 경로를 새 위치로 바꾼다.
- `docs/hyper-waterfall/README.md`의 디렉터리 지도에서 `skills/`를 제거하고, 스킬 위치를 `.agents/skills/`로 안내한다.
- 과거 문서 안의 경로 참조도 새 위치로 정리한다.

## 2026-06-24 구현계획서 승인

### 사용자 피드백

사용자는 `task_m001_003` 구현계획서를 승인했다.

### 결정

- `task_m001_003` 구현계획서의 승인 상태를 `승인됨`으로 변경한다.
- 다음 게이트를 `구현`으로 변경한다.

### 영향

- 이후 구현은 `docs/hyper-waterfall/plans/task_m001_003_impl.md` 범위 안에서 진행한다.
- 구현 중 계획 변경이 필요하면 먼저 문서에 차이를 남긴다.

## 2026-06-24 browser global build 판단

### 사용자 피드백

사용자는 브라우저에서 module로 가져오는 형태와 script로 가져오는 형태가 모두 지원되는지 물었다.

이후 현재 task에서는 browser global script build를 넣지 않고, 추후 별도 지원 예정으로 두겠다고 판단했다.

### 결정

- 이번 task에서는 ESM/CJS package build만 안정화한다.
- `<script src="..."></script>` 기반 IIFE/UMD browser global build는 후속 task로 넘긴다.
- global name, minified/unminified artifact, CDN 예시는 지금 결정하지 않는다.

### 영향

- `packages/chart/tsdown.config.ts`는 현재 `format: ["esm", "cjs"]`만 유지한다.
- `globalName`, `format: ["iife"]`, browser platform build 설정은 이번 task에 추가하지 않는다.
- 기술 기록과 단계 완료보고에 browser global build를 남은 작업으로 기록한다.
