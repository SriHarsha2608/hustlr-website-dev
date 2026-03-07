# Open Source — 35% Weight

**Scoring method**: Rule-based tiers (program & org) + GitHub API + Gemini LLM (impact & depth)
**Raw points**: 110
**Data source**: Form field `openSource[]` + GitHub API

This combines Harsha's rubric (program prestige, org tiers) as the scoring framework with Phanindra's GitHub API pipeline as the data collection layer.

---

## Category A: Program Prestige — Max 40 pts

**Only the highest qualifying program is counted.**

### Tier A++ — 40 pts
- Google Summer of Code (GSoC)

### Tier A+ — 30 pts
- LFX Mentorship (Linux Foundation)
- Outreachy
- Google Season of Docs (GSoD)
- Igalia Coding Experience
- Summer of Nix
- European Summer of Code
- CERN OpenLab Summer Student Programme
- Linux Kernel Mentorship Program
- Open Mainframe Project Mentorship

### Tier A — 20 pts
- MLH Fellowship
- Summer of Bitcoin
- Hyperledger Mentorship
- FOSSASIA Internship
- Season of KDE
- X.Org EVoC
- Julia Season of Contributions (JSoC)
- NumFOCUS DISCOVER
- OSPP (Open Source Promotion Plan)
- Alibaba / Tencent Summer of Code
- Rails Girls Summer of Code
- OSRF Internships
- FreeBSD Foundation Internship Program
- OpenSSF Mentorship

### Tier B — 10 pts
- FOSSEE Fellowship
- Kharagpur Winter of Code (KWoC)
- NJACK Winter of Code
- GirlScript Summer of Code (GSSoC)
- GirlScript Winter of Code
- Social Summer of Code (SSoC)
- Cross Winter of Code
- ERPNext Summer of Code
- MLH Open Source Hackathons

### Tier C — 5 pts
- Hacktoberfest
- Similar event-only contributions

### No program — 0 pts
Student has not participated in any formal open-source program.

---

## Category B: Organizational Tier — Max 30 pts

**Where the code lives.** Only the highest applicable tier is counted.

### 30 pts — Global Open-Source Foundations
Linux Foundation, CNCF, Apache Software Foundation, Mozilla Foundation, Eclipse Foundation, FSF, Python Software Foundation, Rust Foundation, .NET Foundation, OpenJS Foundation, OpenStack Foundation, Wikimedia Foundation, Blender Foundation, Software Freedom Conservancy

### 20 pts — Elite Corporate Repositories
Google, Meta, Microsoft, AWS, Apple, Red Hat, IBM, Oracle, Netflix, Databricks, MongoDB, GitLab, HashiCorp, Vercel, NVIDIA, Intel, AMD, Qualcomm, Stripe, Shopify, Salesforce

### 10 pts — High-Velocity OSS Tools / Startups
Postman, Hasura, Hugging Face, Supabase, Appwrite, ToolJet, Giskard, Snowplow, vLLM, CopilotKit, Home Assistant, Temporal, Airbyte, OpenTelemetry, ArgoCD, Prefect, dbt Labs, LangChain, Ray Project

### 5 pts — Personal / Academic Repositories
Personal portfolios, campus organizations, university repos, "Awesome Lists"

---

## Category C: Quantified Impact — Max 25 pts

Evaluated using **GitHub API data + Gemini LLM analysis**.

### Performance & Efficiency — 10 pts
- Latency / API response time improvement
- CPU / memory usage reduction
- Build or CI time reduction
- Throughput gains, cold-start optimization
- Infrastructure cost reduction

### Scale & Adoption — 8 pts
- Monthly Active Users (MAU)
- npm / PyPI download counts
- Number of dependent packages
- Multi-organization adoption
- CLI installation metrics

### Maintenance & Quality — 7 pts
- Unit test coverage increase
- Fixed bug counts (e.g., "closed 25+ issues")
- Security fixes / CVEs
- Major refactors, deprecated API removal
- Documentation & onboarding improvements

---

## Category D: Technical Depth — Max 15 pts

### Advanced Concepts — 10 pts
Distributed systems, microservices, concurrency/parallelism, caching strategies, database internals, compilers/interpreters, kernel/systems programming, scalability & high availability, system design at scale

### Modern Engineering Stack — 5 pts
Docker/Kubernetes, cloud infrastructure (AWS/GCP/Azure), REST/GraphQL APIs, TypeScript, TDD, CI/CD automation, OAuth/JWT authentication, security best practices

---

## GitHub API Data Collection (Phanindra's Pipeline)

### Profile Authority
```
GET https://api.github.com/users/{username}
→ followers, public_repos, created_at, bio
```

### Repository Impact
```
GET https://api.github.com/users/{username}/repos
→ Per repo: stars, forks, language, size, created_at, updated_at
```

### External Contributions (Strongest Signal)
```
GET https://api.github.com/users/{username}/events
→ PullRequestEvent, PushEvent, IssuesEvent where repo owner ≠ username
```
Derived: `external_pr_count`, `external_repo_count`, `org_contributions`

### Contribution Consistency
From event timeline: commits per month, active months, longest streak, last active date.

### Technical Depth
From repo data: unique languages, large repo count, tech stack diversity.

---

## Gemini Prompt (for Categories C & D)

```
You are evaluating a student's open source contributions for a resume screening system.

Program: {programName} (Tier: {tier})
Organization: {org_name}
GitHub Profile: {githubProfile}

Top 3 PRs:
1. {topPR1}
2. {topPR2}
3. {topPR3}

Impact claim: {impactDescription}
Impact PR link: {impactPRLink}
Months contributing: {monthsContributing}

GitHub API data:
- Followers: {followers}, Public repos: {public_repos}
- External PRs: {external_pr_count}, External repos: {external_repo_count}
- Total stars: {total_stars}, Total forks: {total_forks}
- Active months: {active_months}, Commits/month: {commits_per_month}
- Languages: {languages}
- Serious repos (stars>20): {serious_repo_count}

Score Categories C and D. Return ONLY a JSON object:
{
  "quantified_impact": {
    "performance": { "score": <0-10>, "reasoning": "<1 sentence>" },
    "scale_adoption": { "score": <0-8>, "reasoning": "<1 sentence>" },
    "maintenance_quality": { "score": <0-7>, "reasoning": "<1 sentence>" },
    "total": <sum, max 25>
  },
  "technical_depth": {
    "advanced_concepts": { "score": <0-10>, "reasoning": "<1 sentence>" },
    "modern_stack": { "score": <0-5>, "reasoning": "<1 sentence>" },
    "total": <sum, max 15>
  }
}
```

---

## Final Score Calculation

```
open_source_raw = category_a + category_b + category_c + category_d
open_source_normalized = open_source_raw / 110
```

Max raw = 40 + 30 + 25 + 15 = 110.

---

## Form Fields Used

From `openSource[]`:
- `programName` → Category A lookup
- `githubProfile` → GitHub API entry point
- `topPR1`, `topPR2`, `topPR3` → PR links for LLM analysis
- `impactDescription` → Category C input
- `impactPRLink` → Impact evidence
- `monthsContributing` → Consistency signal
- `proofLink` → Program verification

---

## Edge Cases

- **No formal program, but strong GitHub**: Category A = 0, but Categories B–D can still yield up to 70 pts (→ ~64% of 35% weight = ~22.3% effective)
- **GSoC but minimal GitHub activity**: Category A = 40, but Categories C & D may be low. Still a strong score due to program prestige.
- **Multiple programs**: Only highest program counts for Category A. But org contributions from all programs count for Categories B–D.
