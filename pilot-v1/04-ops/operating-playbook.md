# Operating Playbook

## Daily cadence

- 09:00 - 09:15: sync (you + associate)
- 09:15 - 11:00: coloc acquisition and qualification
- 11:00 - 13:00: candidate triage and matching
- 14:00 - 16:00: shortlist production and sending
- 16:00 - 17:00: feedback follow-ups and CRM cleanup

## SLA rules

- Start timer when candidate data is complete.
- Send shortlist to coloc in <= 48h.
- If candidate is incomplete:
- one follow-up request
- if still incomplete after follow-up: set `abandon`

## Matching output standard

Every shortlist item must include:

- `compat_score` (0-100)
- `3 alignements` (top positive dimensions)
- `2 frictions` (top weak dimensions)
- recommendation label: `strong fit`, `fit with caution`, `not recommended`

## Weekly scoring change policy

- Max one scoring-weight update per week.
- Any update requires:
- explicit reason in ops log
- before/after examples
- no retroactive KPI rewrite

## Feedback collection protocol

Collect feedback 24-72h after shortlist delivery:

1. "Was this shortlist better than your usual tri?"
2. Score: `much_better`, `better`, `same`, `worse`
3. One free-text comment

If no response after 2 reminders, mark feedback as missing.

## Escalation rules

- If `sla_rate` drops below 80% on any week: reduce intake immediately.
- If `completion_rate` drops below 40% for 5 consecutive days: simplify candidate form.
- If `quality_rate` drops below 60% after 5+ feedbacks: pause acquisition for 24h and recalibrate rubric.
