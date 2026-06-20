---
name: xel-chart-hyper-waterfall
description: Use when working in the xelstack chart repository on planning, implementation, review, reporting, feedback capture, technical notes, or troubleshooting under the project-local Hyper-Waterfall workflow.
---

# Xel Chart Hyper-Waterfall

## Purpose

Use this project-local workflow for every non-trivial change in this repository. The user wants to understand and type the code directly, with Codex acting as navigator, reviewer, debugger, and document keeper.

## Source

This workflow adapts the rhwp Hyper-Waterfall document system:

- https://github.com/edwardkim/rhwp/wiki/Hyper%E2%80%90Waterfall-%EB%AC%B8%EC%84%9C-%EC%B2%B4%EA%B3%84-%EA%B0%80%EC%9D%B4%EB%93%9C

## Required Directories

```text
docs/hyper-waterfall/
  orders/
  plans/
  working/
  reports/
  feedback/
  tech/
  troubleshootings/
  skills/
```

Existing domain source documents live in:

```text
docs/domain/
```

## Workflow

1. Read the relevant `docs/domain/*` files.
2. Create or update the current order in `docs/hyper-waterfall/orders/`.
3. Write an execution plan in `docs/hyper-waterfall/plans/`.
4. Write an implementation plan in `docs/hyper-waterfall/plans/`.
5. Wait for human approval before implementation.
6. During implementation, guide the human through small code slices they can type and understand.
7. After each stage, write a working report in `docs/hyper-waterfall/working/`.
8. Record human corrections in `docs/hyper-waterfall/feedback/`.
9. Record durable technical discoveries in `docs/hyper-waterfall/tech/`.
10. Record failures and fixes in `docs/hyper-waterfall/troubleshootings/`.
11. At task completion, write a final report in `docs/hyper-waterfall/reports/`.

## Human-Types-Code Rule

Default behavior:

- Codex explains the next smallest code unit.
- The human writes the code.
- The human shares diff, error output, or test output.
- Codex reviews, explains, debugs, and updates documents.

Codex may edit files directly only when the user explicitly asks it to.

## Naming

Use milestone and task numbers:

```text
orders/YYYYMMDD.md
plans/task_m001_001.md
plans/task_m001_001_impl.md
working/task_m001_001_stage1.md
reports/task_m001_001_report.md
feedback/task_m001_001_feedback.md
tech/task_m001_001_topic.md
troubleshootings/task_m001_001_issue.md
```

## Approval Gates

Do not cross these gates silently:

- order created
- execution plan approved
- implementation plan approved
- stage report approved
- final report approved

If the user says to proceed, record that approval in the relevant document before continuing.

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
