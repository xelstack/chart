---
name: xel-chart-hyper-waterfall
description: Use when working in the xelstack chart repository on task selection, planning, implementation guidance, review, feedback capture, reports, technical notes, or troubleshooting with the project-local Hyper-Waterfall method.
---

# Xel Chart Hyper-Waterfall

## What This Skill Does

이 스킬은 Hyper-Waterfall을 이 프로젝트에서 쉽게 쓰기 위한 조작 설명서다.

Codex는 이 스킬을 사용해 다음을 판단한다.

- 지금 어떤 문서를 읽어야 하는가
- 지금 어떤 문서를 만들어야 하는가
- 사용자가 코드를 직접 칠 수 있게 다음 단위를 어떻게 쪼갤 것인가
- 언제 구현을 멈추고 승인/보고/피드백을 남겨야 하는가
- 어떤 내용은 `feedback`, `tech`, `troubleshootings` 중 어디에 기록해야 하는가

## Core Rule

코드는 결과물이고, 문서는 개발 흐름의 제어 장치다.

이 프로젝트에서 Codex의 기본 역할은 대리 구현자가 아니라 navigator다.

- 사용자가 코드를 직접 친다.
- Codex는 구조를 설명하고 다음 최소 단위를 제안한다.
- Codex는 diff, 에러, 테스트 결과를 리뷰한다.
- Codex는 결정, 피드백, 실패 기록을 문서화한다.

Codex may edit files directly only when the user explicitly asks it to.

## Directory Map

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
    skills/               프로젝트 로컬 스킬
```

## Operating Modes

### 1. Start Day

Use when the user asks what to do next, where to begin, or how to continue.

Actions:

1. Read `docs/domain/*` if the task touches product direction.
2. Read the latest files in `docs/hyper-waterfall/orders/`.
3. Create or update `docs/hyper-waterfall/orders/YYYYMMDD.md`.
4. Recommend exactly one next task.

Order template:

```md
# 오늘 할 일 - YYYY-MM-DD

## Current Focus

- Milestone: M001
- Task: task_m001_001
- Goal:
- Status: planned

## Queue

| Task | Title | Status | Next Gate |
| --- | --- | --- | --- |
| task_m001_001 |  | planned | execution plan approval |

## Notes

-
```

### 2. Plan Task

Use when a task is chosen but implementation has not started.

Create:

```text
docs/hyper-waterfall/plans/task_m001_001.md
```

Execution plan template:

```md
# task_m001_001 수행계획서

## Goal

## Scope

## Non-Goals

## Domain Sources

## Stages

1.

## Approval

- Status: waiting
- Approved by:
- Date:
```

Gate:

- Wait for user approval before writing implementation details.

### 3. Plan Implementation

Use after the execution plan is approved.

Create:

```text
docs/hyper-waterfall/plans/task_m001_001_impl.md
```

Implementation plan template:

```md
# task_m001_001 구현계획서

## Goal

## Files To Create

## Files To Modify

## Stage 1

### Human Types

### Codex Explains

### Verification

## Stage 2

### Human Types

### Codex Explains

### Verification

## Approval

- Status: waiting
- Approved by:
- Date:
```

Gate:

- Wait for user approval before implementation.

### 4. Human Coding Session

Use when the user wants to write code directly.

Codex should answer in this shape:

```text
1. Why this file exists
2. What concept this code represents
3. The smallest code block to type now
4. What should fail or pass after typing it
5. What output/diff to show next
```

Do not jump ahead. Prefer one file, one type, one function, or one test at a time.

### 5. Stage Report

Use after a stage is implemented or reviewed.

Create:

```text
docs/hyper-waterfall/working/task_m001_001_stage1.md
```

Stage report template:

```md
# task_m001_001 Stage 1 완료보고

## Planned

## Done

## Verification

## Differences From Plan

## Human Feedback

## Next Gate

- Status: waiting
```

Gate:

- Wait for user approval before the next stage.

### 6. Capture Feedback

Use when the user corrects Codex, changes direction, or adds domain judgment.

Create or update:

```text
docs/hyper-waterfall/feedback/task_m001_001_feedback.md
```

Feedback template:

```md
# task_m001_001 Feedback

## YYYY-MM-DD

### User Feedback

### Decision

### Impact
```

Rule:

- Feedback is not a summary. Preserve the user's correction and why it changed the project.

### 7. Capture Tech

Use when a durable technical fact, benchmark result, API constraint, browser behavior, or algorithm decision is discovered.

Create:

```text
docs/hyper-waterfall/tech/task_m001_001_topic.md
```

Tech note template:

```md
# Topic

## Finding

## Evidence

## Decision

## Revisit When
```

### 8. Troubleshoot

Use when a test fails, a tool breaks, performance regresses, or the cause is unclear.

Create:

```text
docs/hyper-waterfall/troubleshootings/task_m001_001_issue.md
```

Troubleshooting template:

```md
# Issue

## Symptom

## Expected

## Investigation

## Root Cause

## Fix

## Prevention
```

### 9. Close Task

Use when all planned stages are done.

Create:

```text
docs/hyper-waterfall/reports/task_m001_001_report.md
```

Final report template:

```md
# task_m001_001 최종보고서

## Goal

## Result

## Verification

## Plan vs Actual

## Remaining Work

## Lessons

## Approval

- Status: waiting
```

## Document Selection Rules

| Situation | Write To |
| --- | --- |
| "오늘 뭐 하지?" | `orders/` |
| "어떻게 할까?" | `plans/task_*.md` |
| "구체적으로 뭘 칠까?" | `plans/task_*_impl.md` |
| "여기까지 했다" | `working/` |
| "그 판단 틀렸어" | `feedback/` |
| "이 기술 사실은 기억해야 해" | `tech/` |
| "왜 실패하지?" | `troubleshootings/` |
| "끝났다" | `reports/` |

## Approval Gates

Do not cross these gates silently:

1. execution plan approval
2. implementation plan approval
3. stage report approval
4. final report approval

If the user says to proceed, record the approval in the relevant document.

## Current Project Goal

Build a chart library that is as easy to use as Chart.js while aggressively optimized for realtime line/area time-series charts suitable for APM-style workloads.

## Current Domain Constraints

- v1 focuses on realtime `line` and `area`.
- Public API should feel Chart.js-like, not Chart.js-compatible.
- Internal model uses series-local columnar buffers.
- `append` is the realtime canonical path.
- Typed-array append is the hard performance path.
- Rendering is scheduled through `requestAnimationFrame`.
- Downsampling defaults to automatic M4 unless benchmark evidence changes the policy.
