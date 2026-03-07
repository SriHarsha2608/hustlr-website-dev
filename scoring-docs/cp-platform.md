# CP — Platform Ratings — 15% Weight

**Scoring method**: Rule-based
**Raw points**: 15
**Data source**: Form fields `codeforcesRating`, `codechefRating`
**Combination rule**: **max(Codeforces score, Codechef score)**

---

## Codeforces Scoring (Max 15 Points)

Based on Indian average rating of ~1408 with non-linear scaling (going from 1600→1800 is much harder than 1200→1400).

| Rating | Title | Score | Rationale |
|---|---|---|---|
| 2000+ | Candidate Master+ | 15 | Elite. Top ~1%. |
| 1800–1999 | Expert (High) | 13 | Strong. Conquered the hardest rating gap. |
| 1600–1799 | Expert (Low) | 9 | Good. Well above Indian average. |
| 1400–1599 | Specialist | 5 | Average. Baseline competence (near Indian median). |
| 1200–1399 | Pupil | 2 | Beginner. Knows syntax, needs algorithm practice. |
| < 1200 | Newbie | 0 | Novice. Not competitive yet. |

---

## CodeChef Scoring (Max 15 Points)

Adjusted for rating inflation (~+200 points vs Codeforces).

| Rating | Star | Score | CF Equivalent |
|---|---|---|---|
| 2200+ | 6–7 Star | 15 | CF 2000+ |
| 2000–2199 | 5 Star | 13 | CF 1800+ |
| 1800–1999 | 4 Star | 9 | CF 1600+ |
| 1600–1799 | 3 Star | 5 | CF 1400+ |
| 1400–1599 | 2 Star | 2 | CF 1200+ |
| < 1400 | 1 Star | 0 | CF < 1200 |

---

## Combination Rule

```
platform_score = max(codeforces_score, codechef_score)
```

If a student has only one platform, that platform's score is used. If neither is provided, platform_score = 0.

---

## Form Fields Used

- `codeforcesRating` → Codeforces threshold lookup
- `codeforcesUserId` → For potential verification via Codeforces API (future)
- `codechefRating` → Codechef threshold lookup
- `codechefUserId` → For potential verification via Codechef API (future)

---

## Why Non-Linear?

The jump from 1200 to 1400 takes weeks of practice. The jump from 1800 to 2000 can take years. Linear scoring would under-reward the effort at higher levels. The scoring reflects this exponential difficulty curve.
