# KPI Framework and Go/No-Go Gate

## Core KPI definitions

## `quality_rate` (primary KPI)

Definition:

- numerator: feedback responses scored `much_better` or `better`
- denominator: all received feedback responses

Formula:

```text
quality_rate = feedback_better_or_equal / feedback_received
```

## `completion_rate`

Definition:

- numerator: candidates with complete forms
- denominator: candidates who started the form

Formula:

```text
completion_rate = candidates_completed / candidates_started
```

## `sample_progress`

Definition:

- `colocs_qualified` target = 10
- `candidates_completed` target = 60

## `sla_rate`

Definition:

- numerator: shortlists sent within 48h
- denominator: all shortlists sent

Formula:

```text
sla_rate = sla_in_time_count / shortlists_sent
```

## Hard go/no-go gate (end of week 4)

GO only if all conditions are true:

1. `quality_rate >= 0.70`
2. `completion_rate >= 0.50`
3. `colocs_qualified >= 10` and `candidates_completed >= 60`

If one condition fails -> NO-GO for immediate MVP build.

## Decision notes template

- Decision date:
- Decision: GO / NO-GO
- Condition 1 status:
- Condition 2 status:
- Condition 3 status:
- Main learnings:
- Next action in 7 days:
