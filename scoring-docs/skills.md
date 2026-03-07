# Skills — 10% Weight

**Scoring method**: Rule-based
**Raw points**: 10 (5 + 5)
**Data source**: Form fields `skills[]`, `projects[]`, `category`

---

## Part 1: Category Match — 5 pts

Match the student's listed skills against a **master list** for their chosen category.

### Master Lists (8–10 core skills per track)

| Track | Core Skills |
|---|---|
| **Full Stack / Web** | React, Node.js, Next.js, Django, PostgreSQL, MongoDB, Docker, AWS |
| **Frontend** | React, Vue.js, Next.js, TypeScript, Tailwind CSS, HTML/CSS, Figma, Webpack |
| **Backend** | Node.js, Django, FastAPI, PostgreSQL, MongoDB, Redis, Docker, AWS |
| **Mobile Dev** | Flutter, React Native, Swift, Kotlin, Firebase, SQLite, API Integration |
| **AI / ML** | Python, TensorFlow, PyTorch, Pandas, Scikit-Learn, SQL, FastAPI, HuggingFace |

### Scoring

| Skills Matched | Score | Profile |
|---|---|---|
| 4+ skills | 5 pts | **Complete Stack** — Has all pieces to build a real product. |
| 2–3 skills | 3 pts | **Partial Stack** — e.g., knows React and Python, missing DB/Cloud. |
| 1 skill | 1 pt | **Beginner** — Only one relevant tool. |
| 0 skills | 0 pts | **Irrelevant** — Applied for Mobile Dev but only listed Web skills. |

### Matching Logic

- Case-insensitive comparison
- Match against `skills[].skill` field
- The student's `category` determines which master list to use:
  - "Full Stack Developer" → Full Stack / Web
  - "Frontend Developer" → Frontend
  - "Backend Developer" → Backend
  - "Mobile App Developer" → Mobile Dev
  - "AI ML Developer" → AI / ML
- Partial matches count (e.g., "React.js" matches "React", "NodeJS" matches "Node.js")

---

## Part 2: Project Verification — 5 pts

Cross-reference claimed skills with the **tech stacks of their top 3 projects**. This catches "paper dragons" — people who list 20 skills but never used any in real projects.

### Scoring

| Verified Skills | Score | Profile |
|---|---|---|
| 4+ verified | 5 pts | **Proven Builder** — Claims React, Node, Mongo and projects confirm it. |
| 2–3 verified | 3 pts | **Standard Builder** — Validated frontend + backend tools. |
| 1 verified | 1 pt | **Basic Proof** — At least one skill confirmed in projects. |
| 0 verified | 0 pts | **Paper Dragon** — Listed 20 skills, projects don't use any. Auto-flag low trust. |

### Matching Logic

- Take `projects[].techStack[]` from the top 3 projects (by order submitted)
- Flatten all tech stacks into a single set
- Intersect with `skills[].skill`
- Count unique matches

---

## Form Fields Used

- `category` → Determines which master list to use
- `skills[]` → Each has `skill` (name) and `proficiency` (Beginner/Intermediate/Advanced/Expert)
- `projects[].techStack[]` → Array of tech strings per project

---

## Implementation Notes

- Proficiency level (Beginner/Intermediate/Advanced/Expert) is collected but **not used in scoring** — only the skill name matters for matching
- We may want to normalize skill names (e.g., "ReactJS" → "React", "node" → "Node.js") using a synonym map
