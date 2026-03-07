# Hustlr Scoring Engine — Overview

## Philosophy

The scoring system is designed so that **students with different strengths can all reach near 100%**. Not everyone needs to be a competitive programmer or have published research — the total raw weight adds up to more than 100%, and the final score is scaled down.

A strong open-source contributor with good internships can score just as high as a CP champion with great projects. The system rewards **depth in any area**, not breadth across all.

---

## Weight Table

| # | Category | Weight | Raw Points | Scoring Method | Data Source |
|---|---|---|---|---|---|
| 1 | Internships | 30% | 30 | Rule-based | Form data |
| 2 | Open Source | 35% | 110 | Rule-based tiers + GitHub API + Gemini LLM | Form data + GitHub API |
| 3 | Projects | 25% | 25 per project (top 3) | Gemini LLM | Form data + GitHub API |
| 4 | Hackathons | 20% | 14 per hackathon (top 3) | Gemini LLM | Form data + GitHub API |
| 5 | Research | 20% or 5% | 10 | Rule-based | Form data |
| 6 | CP — Platform | 15% | 15 | Rule-based | Form data (ratings) |
| 7 | CP — Competitions | 15% | 15 | Rule-based | Form data (competitions) |
| 8 | Skills | 10% | 10 | Rule-based | Form data |
| 9 | CGPA | 10% | 10 | Rule-based | Form data |

**Total weight**: 185% (or 170% if research field doesn't match category) → scaled to 100%.

---

## How Scaling Works

Each category produces a **normalized score from 0 to 1** (raw points / max raw points).

The denominator is **always 185%** (or 170% if research doesn't match). This is the total possible weight across all categories. Every student is measured against the same denominator regardless of how many categories they filled in.

```
Final Score = Σ (category_normalized_score × category_weight) / total_weight × 100
```

Because the total weight is 185% (more than 100%), a student doesn't need to be strong in every category to score well. Someone who aces internships (30%), projects (25%), and open source (35%) — that's 90% out of 185% — can score ~49% even with zeroes everywhere else. That's by design.

**Practical score ranges**:
- 60%+ = Exceptional (strong in 4+ categories)
- 40–60% = Strong candidate (strong in 2–3 categories)
- 20–40% = Average (decent in a few areas)
- <20% = Weak application

**Example**: A student with:
- Internships: 25/30 → 0.83 × 30 = 25.0
- Projects: 20/25 → 0.80 × 25 = 20.0
- Open Source: 70/110 → 0.64 × 35 = 22.3
- Skills: 8/10 → 0.80 × 10 = 8.0
- CGPA: 8/10 → 0.80 × 10 = 8.0
- CP Platform: 9/15 → 0.60 × 15 = 9.0
- Everything else: 0

Weighted sum = 92.3
Final score = 92.3 / 185 × 100 = **49.9%** (Strong candidate)

---

## Research Weight — Dynamic

Research defaults to **5% weight**. If the student's research field matches their selected freelancing category, it becomes **20% weight**. This rewards relevant research without penalizing people whose research is in a different domain.

---

## Scoring Trigger

Scoring is **on-demand** — triggered by the admin from the admin panel. The admin clicks "Score this application" on an individual application, or uses batch scoring to score all unscored applications.

Students **never see** their scores. Only admins do.

---

## Where Scores Are Displayed

1. **Admin list page** (`/admin/`): Score column with sort and filter capabilities
2. **Admin detail page** (`/admin/applications/[email]`): Full score breakdown card with per-category scores and visual breakdown

---

## API Dependencies

| API | Used For | Rate Limits (Free Tier) |
|---|---|---|
| GitHub REST API | Project repos, open source contributions, commit data | 60 req/hr unauthenticated, 5000 req/hr with token |
| Gemini API | Projects scoring, hackathons scoring | 15 RPM / 1M tokens/day (free tier) |

**Caching**: All GitHub API responses and Gemini scoring results are cached per application to avoid redundant calls.

---

## Documentation Index

| File | Category | Details |
|---|---|---|
| [internships.md](internships.md) | Internships (30%) | Company tier, role, duration |
| [cgpa.md](cgpa.md) | CGPA (10%) | GPA thresholds |
| [cp-platform.md](cp-platform.md) | CP Platform (15%) | Codeforces + Codechef ratings |
| [cp-competitions.md](cp-competitions.md) | CP Competitions (15%) | ICPC + other competitions |
| [skills.md](skills.md) | Skills (10%) | Category match + project verification |
| [projects.md](projects.md) | Projects (25%) | AI-scored via Gemini |
| [hackathons.md](hackathons.md) | Hackathons (20%) | AI-scored via Gemini |
| [open-source.md](open-source.md) | Open Source (35%) | Program prestige + GitHub API + Gemini |
| [research.md](research.md) | Research (20%/5%) | Paper rank + field match |
