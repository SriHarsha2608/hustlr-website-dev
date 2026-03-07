# Hackathons — 20% Weight

**Scoring method**: Gemini LLM + GitHub API
**Raw points**: 14 per hackathon, scored on top 3, weighted average
**Data source**: Form field `hackathons[]` + GitHub API

---

## Per-Hackathon Scoring (Max 14 pts)

### 1. Achievement Level — 0 to 7 pts

| Score | Achievement |
|---|---|
| 7 | Winner / 1st place |
| 6 | Top 3 / major category winner |
| 5 | Top 5–10 / track winner |
| 3–4 | Finalist / honorable mention |
| 1–2 | Participation / basic submission |
| 0 | Attendance only (no submission) |

**Signals to look for**: Winner badge, prize amount, official results, specific placement.

### 2. Hackathon Prestige — 0 to 3 pts

| Score | Type | Examples |
|---|---|---|
| 3 | Major international (500+ participants, $50K+ prizes) | MLH flagship, Devpost major |
| 2.5 | National / top university | IIT/NIT hackathons, Smart India Hackathon |
| 2 | Regional / mid-tier | State-level, mid-tier college |
| 1.5 | Local / college | College-internal hackathons |
| 1 | Small online | Weekend online hacks |
| 0.5 | Very small / informal | Club-level, informal events |

**Signals**: Participant count, sponsor quality, MLH/Devpost affiliation, prize pool.

### 3. Project Quality — 0 to 3 pts

| Score | Quality |
|---|---|
| 3 | Polished, deployed, clean docs — impressive given 24–48hr constraint |
| 2 | Working prototype, main features functional |
| 1 | Basic/partial, concept proven |
| 0 | Non-functional or no submission |

**Signals**: Live demo, README quality, tech complexity for hackathon context, GitHub activity during hackathon period.

### 4. Role & Ownership — 0 to 1 pt

| Score | Role |
|---|---|
| 1.0 | Significant contributor (30%+ commits or led key feature) |
| 0.7 | Equal team member |
| 0.5 | Supporting role |
| 0.3 | Minor role |
| 0 | Unclear / non-technical role |

---

## Top 3 Weighted Average

```
hackathon_normalized = (0.50 × best + 0.30 × second + 0.20 × third) / 14
```

This produces a 0–1 value. The 20% weight is applied in the final scoring formula (see overview.md).

If student has fewer than 3 hackathons:
- 2 hackathons: `0.60 × best + 0.40 × second`
- 1 hackathon: `1.0 × only`

---

## Gemini Prompt Structure

```
You are evaluating a hackathon achievement for a resume screening system.

Hackathon info:
- Name: {name}
- Project Name: {projectName}
- Description: {description}
- Placement claimed: {placement}
- Type: {type}
- Team Size: {teamSize}
- Student's Role: {role}
- Tech Stack: {techStack}

GitHub data (if available):
- Repo created: {created_date}
- Commits during hackathon period: {commit_count}
- Contributors: {contributors}
- Student's commit %: {commit_percentage}%
- README exists: {readme_exists}

Score this hackathon on these 4 dimensions. Return ONLY a JSON object:
{
  "achievement": { "score": <0-7>, "reasoning": "<1 sentence>" },
  "prestige": { "score": <0-3>, "reasoning": "<1 sentence>" },
  "project_quality": { "score": <0-3>, "reasoning": "<1 sentence>" },
  "ownership": { "score": <0-1, can be decimal>, "reasoning": "<1 sentence>" },
  "total": <sum>
}
```

---

## Form Fields Used

From `hackathons[]`:
- `name` → Hackathon identification + prestige lookup
- `projectName` → Project identification
- `description` → Primary input for LLM
- `placement` → Achievement level
- `githubLink` → GitHub API data source
- `type` → Prestige classification
- `teamSize` → Ownership context
- `role` → Ownership scoring
- `techStack[]` → Technical complexity signal

---

## Edge Cases

- **No GitHub link**: Score project quality based on description only. Ownership defaults to role description.
- **No placement info**: Default achievement to 1 (participation).
- **Unknown hackathon name**: Default prestige to 1.5 (middle ground). Admin can override.
