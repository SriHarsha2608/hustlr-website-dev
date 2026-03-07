# Research — 20% or 5% Weight (Dynamic)

**Scoring method**: Rule-based
**Raw points**: 10
**Data source**: Form fields `hasPublishedResearch`, `researchPapers[]`, `category`

---

## Dynamic Weight Rule

| Condition | Weight |
|---|---|
| Research field **matches** student's selected freelancing category | **20%** |
| Research field **does not match** category | **5%** |

This rewards relevant research heavily while not penalizing students whose research is in a different domain.

**What "matches" means**: If a student selected "AI/ML" as their category and their papers are in machine learning, NLP, computer vision → match. If they're in "Full Stack" but papers are about chemistry → no match. The matching is done via keyword analysis of paper titles/venues against the category.

---

## Paper Rank Scoring

| Condition | Points |
|---|---|
| A* paper, OR 2 or more A papers | 10 |
| 1 A paper | 8 |
| B* paper | 7 |
| B paper | 6 |
| Workshop paper | 4 |
| Researcher (no published papers, but active in research) | 2 |

**Multiple papers**: Take the **best single paper** score. Exception: 2+ A papers = 10 pts (same as A*).

---

## Form Fields Used

- `hasPublishedResearch` → "Yes" / "No" gate
- `researchPapers[]`:
  - `title` → Paper identification + field matching
  - `venue` → Conference/journal name (for field matching and prestige)
  - `rank` → "A*" | "A" | "B*" | "B" | "C" | "Unranked" (direct scoring lookup)
  - `year` → Recency (informational)
  - `verificationLink` → Proof of publication

- `category` → Student's chosen freelancing category (for field matching)

---

## Rank Mapping to Points

```
rank_to_points = {
  "A*": 10,
  "A": 8,
  "B*": 7,
  "B": 6,
  "C": 4,       // Treated as workshop-level
  "Unranked": 4  // Treated as workshop-level
}
```

If `hasPublishedResearch === "No"` → 0 points (student opted out).

If `hasPublishedResearch === "Yes"` but no papers listed → 2 points (researcher, no publications).

---

## Implementation Notes

- The form schema needs `"B*"` added to the research paper rank enum (currently missing)
- Field matching between paper titles/venues and freelancing categories can be done with keyword lists initially, upgraded to LLM classification later if needed
- Students are told to only mention research if the field matches their freelancing category (disclaimer in form)
