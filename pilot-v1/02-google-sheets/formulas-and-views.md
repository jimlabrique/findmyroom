# Google Sheets Formulas and Filter Views

## Formulas (`Pilot KPI` tab)

Assume headers are on row 1 and first data row is row 2.

## `completion_rate` (column F)

In `F2`:

```text
=IF(D2>0,E2/D2,0)
```

## `quality_rate` (column J)

In `J2`:

```text
=IF(H2>0,I2/H2,0)
```

## `sla_rate` (column L)

In `L2`:

```text
=IF(G2>0,K2/G2,0)
```

Drag formulas down for all week rows.

## Formulas (`Matches` tab)

Assume:

- `created_at` in column M
- `shortlist_sent_at` in column N
- `sla_deadline` in column O
- `sla_in_time` in column P

In `O2`:

```text
=IF(M2="","",M2+2)
```

In `P2`:

```text
=IF(N2="","",IF(N2<=O2,1,0))
```

`+2` means +48 hours because dates are day-based in Sheets.

## Filter views (Google Sheets)

Create named filter views in each tab.

## `Colocs - New`

- Tab: `Colocs`
- Condition: `status = new_coloc`
- Sort: `created_at` ascending

## `Colocs - Qualified In Progress`

- Tab: `Colocs`
- Condition: `status in [coloc_qualified, candidates_incoming]`
- Sort: `room_available_date` ascending

## `Matches - To Process`

- Tab: `Matches`
- Condition: `match_decision` blank OR `follow_up_once`
- Sort: `created_at` ascending

## `Matches - SLA Risk`

- Tab: `Matches`
- Condition: `shortlist_sent_at` blank AND `sla_deadline` within next 6h
- Implementation helper column (optional):
  - `=IF(AND(N2="",O2<>""),O2-NOW(),"")`

## `Matches - Sent Awaiting Feedback`

- Tab: `Matches`
- Condition: `match_decision = shortlist` and `shortlist_sent_at` not blank
- Sort: `shortlist_sent_at` descending

## `Colocs - Feedback Pending`

- Tab: `Colocs`
- Condition: `status = shortlist_sent` and `feedback_score` blank

## Validation rules (manual)

- Never set `match_decision = shortlist` if `explain_top_matches` or `explain_top_frictions` are empty.
- Never set `status = closed` before at least one feedback attempt is logged.
- For `incomplete` candidates, allow only one follow-up (`follow_up_count <= 1`) before `abandon`.
