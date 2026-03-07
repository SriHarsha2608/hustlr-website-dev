/**
 * Test endpoint for Phase 1 rule-based scorers.
 * POST /api/admin/test/scorers — runs all scorers on 3 mock profiles and checks results.
 *
 * Returns pass/fail for each test case with detailed score breakdowns.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { SupabaseVettingData } from "@/src/lib/schemas/formSchema";
import { scoreCgpa } from "@/src/lib/scoring/cgpa";
import { scoreCpPlatform } from "@/src/lib/scoring/cpPlatform";
import { scoreCpCompetitions } from "@/src/lib/scoring/cpCompetitions";
import { scoreResearch, isResearchFieldMatch } from "@/src/lib/scoring/research";
import { scoreSkills } from "@/src/lib/scoring/skills";
import { scoreInternships } from "@/src/lib/scoring/internships";
import { CategoryScore } from "@/src/lib/scoring/types";

// ─── Mock Data ───

/**
 * Profile A: Strong AI/ML student — high CGPA, good CF rating, ICPC regional,
 * AI research with A* paper, matching skills, Google internship.
 */
const PROFILE_A: Partial<SupabaseVettingData> = {
  email: "test-strong@example.com",
  name: "Test Strong",
  category: "AI ML Developer",
  cgpa: 9.5,
  codeforcesRating: "1850",
  codechefRating: "1900",
  hasQualifiedCpCompetitions: "Yes",
  cpCompetitions: [
    { name: "ICPC Regional", achievement: "Participated in regional round", year: "2024" },
  ],
  hasPublishedResearch: "Yes",
  researchPapers: [
    {
      title: "Deep Learning for Natural Language Processing",
      venue: "NeurIPS 2024",
      rank: "A*",
      year: "2024",
      verificationLink: "https://example.com/paper1",
    },
  ],
  skills: [
    { skill: "Python", proficiency: "Expert" },
    { skill: "PyTorch", proficiency: "Advanced" },
    { skill: "TensorFlow", proficiency: "Advanced" },
    { skill: "Pandas", proficiency: "Intermediate" },
    { skill: "SQL", proficiency: "Intermediate" },
  ],
  projects: [
    {
      title: "ML Pipeline",
      type: "Personal",
      members: "Solo",
      description: "End-to-end ML pipeline",
      techStack: ["python", "pytorch", "pandas", "docker"],
      startMonth: "January",
      startYear: "2024",
      endMonth: "March",
      endYear: "2024",
    },
  ],
  experiences: [
    {
      title: "ML Engineer Intern",
      employmentType: "Internship",
      company: "Google",
      description: "Built machine learning models for search ranking",
      skills: ["Python", "TensorFlow"],
      startMonth: "May",
      startYear: "2024",
      endMonth: "August",
      endYear: "2024",
    },
  ],
  college: "IIT Test",
  year: "3",
  dob: "2002-01-01",
  projectDeadline: "2025-12-31",
};

/**
 * Profile B: Mid-tier Full Stack developer — decent CGPA, no CP, no research,
 * some matching skills, startup internship.
 */
const PROFILE_B: Partial<SupabaseVettingData> = {
  email: "test-mid@example.com",
  name: "Test Mid",
  category: "Full Stack Developer",
  cgpa: 8.2,
  codeforcesRating: "",
  codechefRating: "",
  hasQualifiedCpCompetitions: "No",
  cpCompetitions: [],
  hasPublishedResearch: "No",
  researchPapers: [],
  skills: [
    { skill: "React", proficiency: "Advanced" },
    { skill: "Node.js", proficiency: "Advanced" },
    { skill: "MongoDB", proficiency: "Intermediate" },
    { skill: "Docker", proficiency: "Beginner" },
  ],
  projects: [
    {
      title: "E-commerce Platform",
      type: "Personal",
      members: "Group",
      description: "Full stack e-commerce app",
      techStack: ["react", "node.js", "mongodb", "docker"],
      startMonth: "January",
      startYear: "2024",
      endMonth: "April",
      endYear: "2024",
    },
  ],
  experiences: [
    {
      title: "Full Stack Developer Intern",
      employmentType: "Internship",
      company: "Groww",
      description: "Developed backend APIs and frontend features",
      skills: ["React", "Node.js"],
      startMonth: "June",
      startYear: "2024",
      endMonth: "August",
      endYear: "2024",
    },
  ],
  college: "NIT Test",
  year: "3",
  dob: "2002-06-15",
  projectDeadline: "2025-12-31",
};

/**
 * Profile C: Minimal / edge case — low CGPA, no CP, no research,
 * no experiences, minimal skills.
 */
const PROFILE_C: Partial<SupabaseVettingData> = {
  email: "test-minimal@example.com",
  name: "Test Minimal",
  category: "Frontend Developer",
  cgpa: 5.5,
  codeforcesRating: "",
  codechefRating: "",
  hasQualifiedCpCompetitions: "No",
  cpCompetitions: [],
  hasPublishedResearch: "No",
  researchPapers: [],
  skills: [{ skill: "HTML", proficiency: "Beginner" }],
  projects: [],
  experiences: [],
  college: "Test College",
  year: "2",
  dob: "2003-01-01",
  projectDeadline: "2025-12-31",
};

// ─── Assertions ───

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  score: CategoryScore;
}

function assertRange(actual: number, min: number, max: number): boolean {
  return actual >= min && actual <= max;
}

function assertExact(actual: number, expected: number): boolean {
  return actual === expected;
}

function runTests(): { results: TestResult[]; summary: { passed: number; failed: number } } {
  const results: TestResult[] = [];
  const w = 100; // Use weight=100 so weighted = normalized * 100 for easy testing

  // ─── CGPA Tests ───
  {
    const r = scoreCgpa(PROFILE_A as SupabaseVettingData, w);
    results.push({
      name: "CGPA: 9.5 → 10 pts",
      passed: assertExact(r.raw, 10),
      expected: "raw=10",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }
  {
    const r = scoreCgpa(PROFILE_B as SupabaseVettingData, w);
    results.push({
      name: "CGPA: 8.2 → 7 pts",
      passed: assertExact(r.raw, 7),
      expected: "raw=7",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }
  {
    const r = scoreCgpa(PROFILE_C as SupabaseVettingData, w);
    results.push({
      name: "CGPA: 5.5 → 0 pts",
      passed: assertExact(r.raw, 0),
      expected: "raw=0",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }

  // ─── CP Platform Tests ───
  {
    // Profile A: CF=1850 → 13, CC=1900 → 9. max=13
    const r = scoreCpPlatform(PROFILE_A as SupabaseVettingData, w);
    results.push({
      name: "CP Platform: CF=1850,CC=1900 → max=13",
      passed: assertExact(r.raw, 13),
      expected: "raw=13",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }
  {
    // Profile B: No ratings → 0
    const r = scoreCpPlatform(PROFILE_B as SupabaseVettingData, w);
    results.push({
      name: "CP Platform: No ratings → 0",
      passed: assertExact(r.raw, 0),
      expected: "raw=0",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }

  // ─── CP Competitions Tests ───
  {
    // Profile A: ICPC Regional participated → 8 pts
    const r = scoreCpCompetitions(PROFILE_A as SupabaseVettingData, w);
    results.push({
      name: "CP Competitions: ICPC Regional → 8 pts",
      passed: assertExact(r.raw, 8),
      expected: "raw=8",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }
  {
    // Profile B: No competitions → 0
    const r = scoreCpCompetitions(PROFILE_B as SupabaseVettingData, w);
    results.push({
      name: "CP Competitions: None → 0",
      passed: assertExact(r.raw, 0),
      expected: "raw=0",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }

  // ─── Research Tests ───
  {
    // Profile A: A* paper in NLP → 10 pts, field matches AI ML
    const r = scoreResearch(PROFILE_A as SupabaseVettingData, w);
    results.push({
      name: "Research: A* paper → 10 pts",
      passed: assertExact(r.raw, 10),
      expected: "raw=10",
      actual: `raw=${r.raw}`,
      score: r,
    });

    const match = isResearchFieldMatch(
      PROFILE_A.category!,
      PROFILE_A.researchPapers!
    );
    results.push({
      name: "Research: AI ML + NLP paper → field match = true",
      passed: match === true,
      expected: "true",
      actual: String(match),
      score: r,
    });
  }
  {
    // Profile B: No research → 0
    const r = scoreResearch(PROFILE_B as SupabaseVettingData, w);
    results.push({
      name: "Research: No research → 0 pts",
      passed: assertExact(r.raw, 0),
      expected: "raw=0",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }

  // ─── Skills Tests ───
  {
    // Profile A: AI ML Developer with Python, PyTorch, TensorFlow, Pandas, SQL
    // Master list: python, tensorflow, pytorch, pandas, scikit-learn, sklearn, sql, ...
    // Part 1: 5 matched → 5 pts
    // Part 2: cross-ref with project techStack [python, pytorch, pandas, docker]
    //   Python→yes, PyTorch→yes, TensorFlow→no (not in techStack), Pandas→yes, SQL→no
    //   3 verified → 3 pts
    // Total: 5+3 = 8
    const r = scoreSkills(PROFILE_A as SupabaseVettingData, w);
    results.push({
      name: "Skills: AI ML + 5 skills → raw=8",
      passed: assertExact(r.raw, 8),
      expected: "raw=8",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }
  {
    // Profile B: Full Stack with React, Node.js, MongoDB, Docker
    // Master list: react, node.js, nodejs, next.js, nextjs, django, postgresql, postgres, mongodb, mongo, docker, aws, express, typescript, graphql
    // Part 1: React→yes, Node.js→yes, MongoDB→yes, Docker→yes = 4 matched → 5 pts
    // Part 2: techStack [react, node.js, mongodb, docker]
    //   React→yes, Node.js→yes, MongoDB→yes, Docker→yes = 4 verified → 5 pts
    // Total: 5+5 = 10
    const r = scoreSkills(PROFILE_B as SupabaseVettingData, w);
    results.push({
      name: "Skills: Full Stack + 4 matching + all in projects → raw=10",
      passed: assertExact(r.raw, 10),
      expected: "raw=10",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }
  {
    // Profile C: Frontend with only HTML
    // Master list has "html" → 1 match → 1 pt
    // No projects → 0 verified → 0 pt
    // Total: 1+0 = 1
    const r = scoreSkills(PROFILE_C as SupabaseVettingData, w);
    results.push({
      name: "Skills: Frontend + HTML only → raw=1",
      passed: assertExact(r.raw, 1),
      expected: "raw=1",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }

  // ─── Internships Tests ───
  {
    // Profile A: Google, ML Engineer Intern, May-Aug 2024 (3 months)
    // Company: Google → Tier 1 → 15 pts
    // Role: "ML Engineer Intern" + "machine learning" → Core Technical → 10 pts
    // Duration: 3 months → 5 pts
    // Total: 30/30
    const r = scoreInternships(PROFILE_A as SupabaseVettingData, w);
    results.push({
      name: "Internships: Google ML 3mo → raw=30",
      passed: assertExact(r.raw, 30),
      expected: "raw=30",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }
  {
    // Profile B: Groww, Full Stack Developer Intern, Jun-Aug 2024 (2 months)
    // Company: Groww → Tier 3 → 9 pts
    // Role: "Full Stack Developer" → Core Technical → 10 pts
    // Duration: 2 months → 4 pts
    // Total: 23/30
    const r = scoreInternships(PROFILE_B as SupabaseVettingData, w);
    results.push({
      name: "Internships: Groww FullStack 2mo → raw=23",
      passed: assertExact(r.raw, 23),
      expected: "raw=23",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }
  {
    // Profile C: No experiences → 0
    const r = scoreInternships(PROFILE_C as SupabaseVettingData, w);
    results.push({
      name: "Internships: None → raw=0",
      passed: assertExact(r.raw, 0),
      expected: "raw=0",
      actual: `raw=${r.raw}`,
      score: r,
    });
  }

  // ─── Normalized/Weighted sanity checks ───
  {
    const r = scoreCgpa(PROFILE_A as SupabaseVettingData, 10);
    results.push({
      name: "Weighted: CGPA 9.5 w=10 → weighted=10",
      passed: assertExact(r.weighted, 10),
      expected: "weighted=10",
      actual: `weighted=${r.weighted}`,
      score: r,
    });
  }
  {
    const r = scoreCpPlatform(PROFILE_A as SupabaseVettingData, 15);
    // normalized = 13/15 = 0.8667, weighted ≈ 13.0
    results.push({
      name: "Weighted: CP Platform CF=1850 w=15 → weighted=13",
      passed: assertExact(r.weighted, 13),
      expected: "weighted=13",
      actual: `weighted=${r.weighted}`,
      score: r,
    });
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return { results, summary: { passed, failed } };
}

// ─── API Handler ───

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { results, summary } = runTests();
    const status = summary.failed === 0 ? 200 : 422;

    return res.status(status).json({
      status: summary.failed === 0 ? "ALL PASSED" : "SOME FAILED",
      summary,
      tests: results.map(({ name, passed, expected, actual, score }) => ({
        name,
        passed,
        expected,
        actual,
        reasoning: score.reasoning,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      error: "Test runner crashed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
