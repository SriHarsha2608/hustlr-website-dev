# Internships — 30% Weight

**Scoring method**: Rule-based
**Raw points**: 30
**Data source**: Form field `experiences[]`

---

## Breakdown

### 1. Company Tier — 15 pts

| Points | Tier | Examples |
|---|---|---|
| 14–15 | Big Tech / Global Leaders | Google, Goldman Sachs, Nvidia, Microsoft, Apple, Amazon |
| 11–13 | Established Companies | Oracle, Dell, SAP, Infosys (product roles) |
| 8–10 | Small Tech / Series A Startups | Cred, Meesho, Groww, Razorpay |
| 5–7 | Small Startups / Freelancing | Early-stage startups, freelance contracts |
| 0 | No internship / experience | — |

**Reference**: [Fortune Global 500](https://fortune.com/ranking/global500/) for company classification.

**Implementation note**: We'll maintain a lookup table of known companies mapped to tiers. For unknown companies, the LLM can classify based on description, or default to 5–7 (startup tier) and let admin override.

---

### 2. Job Role — 10 pts

| Points | Role Type | Examples |
|---|---|---|
| 10 | Core Technical / Specialized | Software Developer, Data Analyst, ML Researcher, SDE |
| 8 | Operational / Semi-Technical | Marketing Analytics, Product Management, Project Coordination |
| 6 | Support / General | Customer Support, Data Entry, Admin, Social Media Management |

---

### 3. Duration — 5 pts

| Points | Duration | Level |
|---|---|---|
| 5 | 3+ months | Full summer / extended internship |
| 4 | 2–3 months | Moderate exposure |
| 2 | 1–2 months | Orientation-level |

---

## Which Employment Types Count

From the form's `employmentType` field:

| Employment Type | Counts? | Notes |
|---|---|---|
| Internship | **Yes** | Primary target of this category |
| Freelancing | **Yes** | Scored at company tier 5–7 (Small Startups / Freelancing) |
| Part time | **Yes** | Scored normally based on company + role + duration |
| Self Employed | **No** | Too hard to verify, skip |
| Apprenticeship | **Yes** | Scored normally |

---

## Multiple Experiences

If a student has multiple qualifying experiences, take the **best single experience score**. One strong internship at Google matters more than three weak freelance gigs.

---

## Form Fields Used

From `experiences[]`:
- `company` → Company tier lookup
- `title` → Role classification
- `employmentType` → Filter (include Internship, Freelancing, Part time, Apprenticeship; exclude Self Employed)
- `startMonth`, `startYear`, `endMonth`, `endYear` → Duration calculation
- `description` → Fallback for role classification

---

## Verification

- Offer letter verification is mentioned in original spec but not currently collected in the form
- For now, scoring trusts the submitted data; admin can flag suspicious entries during review
