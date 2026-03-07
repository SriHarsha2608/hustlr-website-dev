# Projects — 25% Weight

**Scoring method**: Gemini LLM + GitHub API
**Raw points**: 25 per project, scored on top 3, weighted average
**Data source**: Form field `projects[]` + GitHub API

---

## Per-Project Scoring (Max 25 pts)

Each project is scored across 4 dimensions:

### 1. Technical Depth — 0 to 7 pts

| Score | Indicators |
|---|---|
| 0–1 | Tutorial clone, no original logic, Firebase+React template with minor changes |
| 2–3 | Basic CRUD with 1–2 models, simple REST API, standard auth, minimal business logic |
| 4–5 | Custom algorithms, non-trivial state management, background jobs, caching, custom API design, testing present |
| 6 | Distributed systems, microservices, complex ML pipeline (training+serving+monitoring), performance optimization, scalability |
| 7 | Novel algorithms, research-level ML, systems programming (compilers, databases, OS-level), open-source framework contributions, concurrency/distributed consensus |

### 2. Complexity — 0 to 5 pts

| Score | Definition |
|---|---|
| 1 | Single script/notebook, <500 lines, one file |
| 2 | 2–3 components, frontend + simple backend OR ML model + basic API |
| 3 | Full-stack app with database, auth, multiple routes/pages |
| 4 | Multi-service architecture (separate frontend/backend/database), OR ML with data pipeline + model serving, OR hardware + software (IoT, embedded) |
| 5 | Distributed system (microservices, load balancing), OR end-to-end ML platform, OR complex hardware system (PCB + firmware + software) |

### 3. Completion — 0 to 8 pts

| Score | Signals |
|---|---|
| 1–2 | README says "WIP"/"TODO"/"In Progress", no deployment, major features incomplete, last commit >6 months ago |
| 3–4 | Works locally, clear setup instructions, demo video/screenshots, most features working |
| 5–6 | Deployed (live link), but no monitoring/analytics, hardcoded configs, no error handling |
| 7–8 | Production deployment, environment configs, error handling/logging, CI/CD pipeline, monitoring, edge cases handled, security considerations |

### 4. Ownership — 0 to 5 pts

| Score | Definition |
|---|---|
| 5 | Solo project, 90%+ commits |
| 4 | 2-person team, 40–60% commits OR 3+ team but wrote core modules |
| 3 | 3–5 person team, 20–40% commits, contributed multiple features |
| 2 | Large team (5+), 10–20% commits, contributed specific components |
| 1 | <10% commits OR only documentation/minor fixes |
| 0 | Forked project with cosmetic changes, or username not in contributors |

---

## Top 3 Weighted Average

Score the student's top 3 projects, then take the **weighted average**:

```
project_score = (0.50 × best_project + 0.30 × second_best + 0.20 × third_best)
```

If student has fewer than 3 projects:
- 2 projects: `0.60 × best + 0.40 × second`
- 1 project: `1.0 × only_project`

The final `project_score` is out of 25.

---

## GitHub API Data Collection

For each project with a `githubLink`:

```
GET https://api.github.com/repos/{owner}/{repo}
→ stars, forks, language, created_at, updated_at, size

GET https://api.github.com/repos/{owner}/{repo}/readme
→ README content (Base64 decoded)

GET https://api.github.com/repos/{owner}/{repo}/contributors
→ contributor list with commit counts

GET https://api.github.com/repos/{owner}/{repo}/languages
→ language breakdown
```

**Data passed to Gemini**: project description (from form) + README content + repo metadata + contributor data + language breakdown.

---

## Gemini Prompt Structure

```
You are scoring a student's project for a resume screening system.

Project info from application:
- Title: {title}
- Type: {type} (Course/Personal/Internship/Freelance/Hackathon)
- Members: {members} (Solo/Group)
- Description: {description}
- Tech Stack: {techStack}
- Duration: {startMonth} {startYear} – {endMonth} {endYear}

GitHub data (if available):
- Stars: {stars}, Forks: {forks}
- Created: {created_at}, Last updated: {updated_at}
- Languages: {languages}
- README: {readme_content}
- Contributors: {contributors_with_commit_counts}
- Student's commit %: {calculated_percentage}

Score this project on these 4 dimensions. Return ONLY a JSON object:
{
  "technical_depth": { "score": <0-7>, "reasoning": "<1-2 sentences>" },
  "complexity": { "score": <0-5>, "reasoning": "<1-2 sentences>" },
  "completion": { "score": <0-8>, "reasoning": "<1-2 sentences>" },
  "ownership": { "score": <0-5>, "reasoning": "<1-2 sentences>" },
  "total": <sum>
}
```

---

## Caching Strategy

- GitHub API responses: Cache per repo URL, TTL = 7 days
- Gemini scoring results: Cache per (project_data_hash), permanent until re-scored
- This avoids re-calling APIs when admin re-views the same application

---

## Form Fields Used

From `projects[]`:
- `title` → Project identification
- `type` → Context for scoring (Hackathon project judged differently than Personal)
- `members` → Solo/Group affects ownership scoring
- `description` → Primary input for LLM
- `techStack[]` → Technical complexity signal
- `startMonth`, `startYear`, `endMonth`, `endYear` → Duration context
- `githubLink` → GitHub API data source

---

## Edge Cases

- **No GitHub link**: Score based on description only. Ownership defaults to max 3 (can't verify commits).
- **Private repo**: GitHub API returns 404. Same as no link.
- **Designers / non-code projects**: If no GitHub link and project type suggests design work, score technical_depth more leniently. Flag for admin review.
