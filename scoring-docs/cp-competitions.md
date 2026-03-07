# CP — Competitions (ICPC & Others) — 15% Weight

**Scoring method**: Rule-based
**Raw points**: 15
**Data source**: Form field `cpCompetitions[]`
**Rule**: Take the **best single competition achievement**

---

## ICPC Scoring

| Achievement | Score | Rationale |
|---|---|---|
| World Finals — participated | 15 | Top of the world. |
| World Finals — qualified (didn't attend) | 13 | Qualification alone is elite. |
| Regional — Top 10 team | 12 | Strong regional performance. |
| Regional — Participated | 8 | Cleared prelims, competed at regional level. |
| Preliminary — Qualified for regionals | 5 | Passed the first gate (online rounds). |
| Preliminary — Participated only | 2 | Showed up and competed. |

---

## Other Competitions

| Achievement | Score | Rationale |
|---|---|---|
| Google Code Jam / Meta Hacker Cup — Advanced rounds | 12 | Elite global competitions. |
| Google Kickstart — Top ranks | 9 | Strong performance in competitive rounds. |
| National-level competition — Winner / Top 3 | 10 | National recognition. |
| National-level competition — Participated | 4 | Competed nationally. |
| Any other CP competition — Top 3 | 6 | Solid achievement. |
| Any other CP competition — Participation | 2 | Basic engagement. |

---

## Combination Rule

```
competition_score = max(score of each competition in cpCompetitions[])
```

Only the **single best achievement** counts. This prevents gaming by listing many weak participations.

---

## Form Fields Used

From `cpCompetitions[]`:
- `name` → Competition identification (ICPC, Google Code Jam, etc.)
- `achievement` → Achievement level (Winner, Top 3, Regionalist, etc.)
- `year` → Recency (informational, not scored)
- `verificationLink` → Optional proof

---

## Implementation Notes

- Competition names will need fuzzy matching or keyword detection (e.g., "ICPC" in name → use ICPC scoring table)
- Achievement field is free-text, so we'll need keyword matching: "world finals", "regional", "winner", "top 3", "finalist", etc.
- If achievement text is ambiguous, default to the lower applicable tier
