# CGPA — 10% Weight

**Scoring method**: Rule-based
**Raw points**: 10
**Data source**: Form field `cgpa`

---

## Scoring Table

| CGPA | Points |
|---|---|
| 9.0+ | 10 |
| 8.0–8.99 | 7 |
| 6.0–7.99 | 4 |
| Below 6.0 | 0 |

---

## Implementation Notes

- The `cgpa` form field is a string in decimal format (e.g., "8.25"), validated to be 0–10
- Parse as float, then apply thresholds
- Simple lookup, no AI or API needed

---

## Form Fields Used

- `cgpa` → Direct threshold lookup
