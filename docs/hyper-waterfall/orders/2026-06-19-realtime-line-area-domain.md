# Hyper-Waterfall Order: Realtime Line/Area Domain

## Order

Define the domain model for a Chart.js-like but performance-first realtime line/area chart library.

## Date

2026-06-19

## Objective

Create a stable domain foundation before further implementation. The library must be easy to start with, while preserving a separate typed-array hot path that can be optimized toward APM-grade realtime chart workloads.

## Product Goal

```text
Chart.js-like ease of use
+ extremely optimized realtime performance
+ line/area time-series focus
```

## Accepted Domain Decisions

1. External API is Chart-centered and Chart.js-like.
2. Chart.js drop-in compatibility is not a goal.
3. v1 focuses on realtime time-series `line` and `area`.
4. x scale is time. y scale is linear.
5. `Series` is the internal unit for one line/area time series.
6. Every series has a stable `seriesId`.
7. Internal storage uses series-local columnar x/y buffers.
8. x input accepts `number | Date`; internal x is epoch milliseconds.
9. y input accepts `number | null`; internal gap sentinel is `NaN`.
10. `realtime: true` is the simple public entry point.
11. `append` is the realtime canonical path.
12. object, tuple, and typed-array append inputs are supported.
13. typed-array append is the hard performance path.
14. dataset mutation + `update()` is compatibility path.
15. append does not draw synchronously.
16. render timing is owned by internal RAF scheduler.
17. public `flush()` is excluded.
18. scheduler prioritizes visible/latest work within frame budget.
19. downsampling defaults to auto, with M4 as the internal default candidate.
20. hover tooltip and legend toggle are v1 interactions.
21. zoom/pan and public diagnostics API are deferred.
22. public API is mutable facade; internal domain uses command/event workflow.
23. internal workflow uses Result-style validation.
24. internal events are not public API in v1.

## Relation To Existing Performance Plan

`docs/superpowers/plans/2026-06-18-realtime-performance.md` remains useful as a performance task inventory and benchmark baseline. This order supersedes any earlier public API assumption that `windowMode`, default sliding capacity, `maxPoints`, or `maxBytes` must be exposed or forced in the v1 user-facing contract.

Implementation planning should preserve the performance intent of bounded/visible rendering, but the public v1 API starts from `realtime: true`, ordered append, automatic downsampling, and internal scheduler behavior.

## Deliverables

Domain documents:

- `docs/domain/01-event-storming.md`
- `docs/domain/02-context-map.md`
- `docs/domain/03-domain-model.md`
- `docs/domain/04-invariants.md`
- `docs/domain/05-workflows.md`
- `docs/domain/06-api-contract.md`

Order document:

- `docs/hyper-waterfall/orders/2026-06-19-realtime-line-area-domain.md`

## Macro Waterfall Stages

### Stage 1: Domain Foundation

Status: current order.

Outputs:

- event storming
- context map
- domain model
- invariants
- workflows
- API contract

Gate:

- no unresolved open items
- no contradiction between API and internal model
- v1 scope is explicit
- performance hot path is explicit

### Stage 2: Implementation Plan

Inputs:

- accepted domain docs
- existing realtime performance plan

Outputs:

- task-by-task implementation plan
- test gates
- benchmark gates
- migration path from existing streaming code

### Stage 3: Engine Implementation

Focus:

- command workflow
- append normalization
- series-local columnar storage
- viewport query
- M4 downsampling
- RAF scheduler
- line/area render frame

### Stage 4: Public API Stabilization

Focus:

- `createChart`
- `append`
- `update`
- `setSeriesVisible`
- `destroy`
- examples and docs

### Stage 5: Performance Calibration

Focus:

- typed-array append benchmark
- tuple/object append benchmark
- M4 vs MinMax vs MinMaxLTTB comparison
- real-browser frame timing
- visual regression for gap and spike preservation

## Micro Iteration Loop

Every implementation task should follow this loop:

```text
spec slice
-> failing unit or performance test
-> minimal implementation
-> typecheck
-> focused test
-> benchmark when relevant
-> document result
```

## Quality Gates

- TypeScript typecheck passes.
- Unit tests pass for the changed slice.
- Real-browser performance tests run for performance-sensitive changes.
- Renderer never consumes public `DataPoint[]` as its hot path.
- `append` schedules render but does not draw synchronously.
- invalid input cannot corrupt `SeriesBuffer`.
- gap semantics are preserved through downsampling and rendering.

## Immediate Next Step

After the domain documents are reviewed, write the implementation plan that maps these domain decisions onto the existing `packages/chart-core` codebase.
