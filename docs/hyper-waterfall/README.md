# Hyper-Waterfall Documents

This directory adapts the rhwp Hyper-Waterfall document system for the chart library project.

The purpose is to preserve intent, decisions, feedback, technical findings, and failure history so a new AI session can resume work without relying on chat memory.

## Structure

```text
docs/hyper-waterfall/
  orders/           Daily work orders: what to do now.
  plans/            Execution plans and implementation plans.
  working/          Stage completion reports.
  reports/          Final task reports.
  feedback/         Human review, corrections, and domain feedback.
  tech/             Technical findings and decisions.
  troubleshootings/ Failure analysis and recovery notes.
  skills/           Project-local agent skills.
```

## Gate Rule

Implementation starts only after:

1. An order exists.
2. A plan exists.
3. An implementation plan exists.
4. The human approves the plan.
