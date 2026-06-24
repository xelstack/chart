---
name: xel-chart-hyper-waterfall
description: xelstack chart repository에서 프로젝트 로컬 Hyper-Waterfall 방식으로 작업 선택, 계획, 구현 안내, 리뷰, 피드백 기록, 보고서, 기술 기록, troubleshooting을 수행할 때 사용한다.
---

# Xel Chart Hyper-Waterfall

## 이 Skill이 하는 일

이 스킬은 Hyper-Waterfall을 이 프로젝트에서 쉽게 쓰기 위한 조작 설명서다.

Codex는 이 스킬을 사용해 다음을 판단한다.

- 지금 어떤 문서를 읽어야 하는가
- 지금 어떤 문서를 만들어야 하는가
- 사용자가 코드를 직접 칠 수 있게 다음 단위를 어떻게 쪼갤 것인가
- 언제 구현을 멈추고 승인/보고/피드백을 남겨야 하는가
- 어떤 내용은 `feedback`, `tech`, `troubleshootings` 중 어디에 기록해야 하는가

## 핵심 규칙

코드는 결과물이고, 문서는 개발 흐름의 제어 장치다.

이 프로젝트에서 Codex의 기본 역할은 대리 구현자가 아니라 navigator다.

- 사용자가 코드를 직접 친다.
- Codex는 구조를 설명하고 다음 최소 단위를 제안한다.
- Codex는 diff, 에러, 테스트 결과를 리뷰한다.
- Codex는 결정, 피드백, 실패 기록을 문서화한다.

Codex는 사용자가 명시적으로 요청했을 때만 파일을 직접 편집할 수 있다.

## 디렉터리 지도

```text
docs/
  domain/                 확정된 도메인 모델
  hyper-waterfall/
    orders/               오늘 무엇을 할 것인가
    plans/                수행계획서와 구현계획서
    working/              단계별 완료보고
    reports/              최종 결과보고
    feedback/             사용자의 교정과 판단
    tech/                 기술 조사와 결정
    troubleshootings/     실패 원인과 해결 과정

.agents/
  skills/                 프로젝트 로컬 agent skill
```

## 운영 모드

### 1. 하루 시작

사용자가 다음에 무엇을 할지, 어디서 시작할지, 어떻게 이어갈지 물을 때 사용한다.

행동:

1. task가 제품 방향에 닿으면 `docs/domain/*`를 읽는다.
2. `docs/hyper-waterfall/orders/`의 최신 파일을 읽는다.
3. `docs/hyper-waterfall/orders/YYYYMMDD.md`를 만들거나 업데이트한다.
4. 다음 task를 정확히 하나만 추천한다.

작업 지시서 template:

```md
# 오늘 할 일 - YYYY-MM-DD

## 현재 초점

- Milestone: M001
- Task: task_m001_001
- 목표:
- 상태: 계획됨

## 대기열

| Task          | 제목 | 상태   | 다음 게이트     |
| ------------- | ---- | ------ | --------------- |
| task_m001_001 |      | 계획됨 | 수행계획서 승인 |

## 메모

-
```

### 2. Task 계획

task가 선택되었지만 구현이 시작되지 않았을 때 사용한다.

생성:

```text
docs/hyper-waterfall/plans/task_m001_001.md
```

수행계획서 template:

```md
# task_m001_001 수행계획서

## 목표

## 범위

## 하지 않는 것

## 도메인 출처

## 단계

1.

## 승인

- 상태: 대기
- 승인자:
- 날짜:
```

게이트:

- 구현 세부사항을 쓰기 전에 사용자 승인을 기다린다.

### 3. 구현 계획

수행계획서가 승인된 뒤 사용한다.

생성:

```text
docs/hyper-waterfall/plans/task_m001_001_impl.md
```

구현계획서 template:

```md
# task_m001_001 구현계획서

## 목표

## 생성할 파일

## 수정할 파일

## 단계 1

### 사용자가 직접 작성

### Codex가 설명할 것

### 검증

## 단계 2

### 사용자가 직접 작성

### Codex가 설명할 것

### 검증

## 승인

- 상태: 대기
- 승인자:
- 날짜:
```

게이트:

- 구현 전에 사용자 승인을 기다린다.

### 4. 사용자 직접 코딩 세션

사용자가 코드를 직접 작성하고 싶어 할 때 사용한다.

Codex는 다음 형태로 답한다.

```text
1. 이 파일이 존재하는 이유
2. 이 코드가 표현하는 개념
3. 지금 입력할 가장 작은 코드 블록
4. 입력 후 실패하거나 통과해야 하는 것
5. 다음에 보여줄 output/diff
```

앞서가지 않는다. 한 번에 파일 하나, 타입 하나, 함수 하나, 테스트 하나를 선호한다.

### 5. 단계 완료보고

stage가 구현되거나 리뷰된 뒤 사용한다.

생성:

```text
docs/hyper-waterfall/working/task_m001_001_stage1.md
```

단계 완료보고 template:

```md
# task_m001_001 단계 1 완료보고

## 계획

## 완료

## 검증

## 계획 대비 차이

## 사용자 피드백

## 다음 게이트

- 상태: 대기
```

게이트:

- 다음 stage로 넘어가기 전에 사용자 승인을 기다린다.

### 6. 피드백 기록

사용자가 Codex를 교정하거나, 방향을 바꾸거나, 도메인 판단을 추가할 때 사용한다.

생성 또는 업데이트:

```text
docs/hyper-waterfall/feedback/task_m001_001_feedback.md
```

피드백 template:

```md
# task_m001_001 피드백

## YYYY-MM-DD

### 사용자 피드백

### 결정

### 영향
```

규칙:

- 피드백은 요약이 아니다. 사용자의 교정과 그것이 프로젝트를 바꾼 이유를 보존한다.

### 7. 기술 기록

오래 보존해야 하는 기술 사실, benchmark 결과, API 제약, browser behavior, algorithm decision을 발견했을 때 사용한다.

생성:

```text
docs/hyper-waterfall/tech/task_m001_001_topic.md
```

기술 기록 template:

```md
# 주제

## 발견

## 근거

## 결정

## 다시 볼 시점
```

### 8. Troubleshooting

test가 실패하거나, tool이 깨지거나, 성능이 퇴보하거나, 원인이 불명확할 때 사용한다.

생성:

```text
docs/hyper-waterfall/troubleshootings/task_m001_001_issue.md
```

Troubleshooting 템플릿:

```md
# 이슈

## 증상

## 기대

## 조사

## 근본 원인

## 수정

## 예방
```

### 9. Task 종료

계획된 모든 stage가 끝났을 때 사용한다.

생성:

```text
docs/hyper-waterfall/reports/task_m001_001_report.md
```

최종보고서 template:

```md
# task_m001_001 최종보고서

## 목표

## 결과

## 검증

## 계획 대비 실제

## 남은 작업

## 배운 점

## 승인

- 상태: 대기
```

## 문서 선택 규칙

| 상황                         | 기록 위치              |
| ---------------------------- | ---------------------- |
| "오늘 뭐 하지?"              | `orders/`              |
| "어떻게 할까?"               | `plans/task_*.md`      |
| "구체적으로 뭘 칠까?"        | `plans/task_*_impl.md` |
| "여기까지 했다"              | `working/`             |
| "그 판단 틀렸어"             | `feedback/`            |
| "이 기술 사실은 기억해야 해" | `tech/`                |
| "왜 실패하지?"               | `troubleshootings/`    |
| "끝났다"                     | `reports/`             |

## 승인 게이트

다음 게이트를 조용히 넘지 않는다.

1. 수행계획서 승인
2. 구현계획서 승인
3. 단계 완료보고 승인
4. 최종보고서 승인

사용자가 진행하라고 말하면 관련 문서에 승인을 기록한다.

## 현재 프로젝트 목표

Chart.js처럼 사용하기 쉬우면서도 APM-style workload에 적합한 realtime line/area time-series chart에 대해 공격적으로 최적화된 chart library를 만든다.

## 현재 도메인 제약

- v1은 realtime `line`과 `area`에 집중한다.
- Public API는 Chart.js-compatible이 아니라 Chart.js-like 느낌이어야 한다.
- Internal model은 series-local columnar buffer를 사용한다.
- `append`는 realtime canonical path다.
- Typed-array append는 hard performance path다.
- Rendering은 `requestAnimationFrame`으로 schedule된다.
- Downsampling은 benchmark evidence가 policy를 바꾸기 전까지 automatic M4를 기본으로 한다.
