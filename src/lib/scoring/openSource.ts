/**
 * Open Source Scorer — 35% Weight, 110 Raw Points
 *
 * Category A: Program Prestige (0-40) — rule-based tier lookup
 * Category B: Org Tier (0-30) — rule-based PR URL analysis
 * Category C: Quantified Impact (0-25) — Gemini LLM scoring
 * Category D: Technical Depth (0-15) — Gemini LLM scoring
 */

import { SupabaseVettingData } from "@/src/lib/schemas/formSchema";
import { CategoryScore } from "./types";
import { fetchProfileData, parseGithubUsername, parseRepoSlug } from "./github";
import { geminiScoreJSON } from "./gemini";

const MAX_RAW = 110;

// ─── Category A: Program Prestige (Rule-based) ───

const PROGRAM_TIERS: { tier: string; points: number; keywords: string[] }[] = [
  {
    tier: "A++",
    points: 40,
    keywords: ["gsoc", "google summer of code"],
  },
  {
    tier: "A+",
    points: 30,
    keywords: [
      "lfx", "linux foundation mentorship",
      "outreachy",
      "gsod", "google season of docs",
      "igalia",
      "summer of nix",
      "european summer of code",
      "cern", "openlab",
      "linux kernel mentorship",
      "open mainframe",
    ],
  },
  {
    tier: "A",
    points: 20,
    keywords: [
      "mlh fellowship", "mlh fellow",
      "summer of bitcoin",
      "hyperledger mentorship",
      "fossasia",
      "season of kde",
      "x.org evoc", "xorg",
      "jsoc", "julia season",
      "numfocus", "discover",
      "ospp", "open source promotion",
      "alibaba summer", "tencent summer",
      "rails girls",
      "osrf",
      "freebsd",
      "openssf",
    ],
  },
  {
    tier: "B",
    points: 10,
    keywords: [
      "fossee",
      "kwoc", "kharagpur winter",
      "njack",
      "gssoc", "girlscript summer",
      "girlscript winter",
      "ssoc", "social summer of code",
      "cross winter",
      "erpnext",
      "mlh open source",
    ],
  },
  {
    tier: "C",
    points: 5,
    keywords: ["hacktoberfest"],
  },
];

function getProgramScore(programName: string): { points: number; tier: string } {
  const name = programName.toLowerCase();
  for (const t of PROGRAM_TIERS) {
    for (const kw of t.keywords) {
      if (name.includes(kw)) return { points: t.points, tier: t.tier };
    }
  }
  return { points: 0, tier: "None" };
}

// ─── Category B: Org Tier (Rule-based via PR URLs) ───

const ORG_TIERS: { points: number; label: string; orgs: string[] }[] = [
  {
    points: 30,
    label: "Global Foundation",
    orgs: [
      "linux", "cncf", "apache", "mozilla", "eclipse", "fsf",
      "python", "rust-lang", "dotnet", "openjs", "openstack",
      "wikimedia", "blender", "conservancy", "kubernetes",
      "nodejs", "webpack", "babel", "eslint", "expressjs",
    ],
  },
  {
    points: 20,
    label: "Elite Corporate",
    orgs: [
      "google", "facebook", "meta", "microsoft", "aws", "apple",
      "redhat", "red-hat", "ibm", "oracle", "netflix", "databricks",
      "mongodb", "gitlabhq", "hashicorp", "vercel", "nvidia",
      "intel", "amd", "qualcomm", "stripe", "shopify", "salesforce",
    ],
  },
  {
    points: 10,
    label: "High-Velocity OSS",
    orgs: [
      "postmanlabs", "hasura", "huggingface", "supabase", "appwrite",
      "tooljet", "home-assistant", "temporalio", "airbytehq",
      "open-telemetry", "argoproj", "prefecthq", "dbt-labs",
      "langchain-ai", "ray-project", "vllm-project", "copilotkit",
    ],
  },
];

function getOrgScore(prUrls: string[]): { points: number; label: string } {
  let best = { points: 5, label: "Personal/Academic" }; // default

  for (const url of prUrls) {
    const slug = parseRepoSlug(url);
    if (!slug) continue;
    const owner = slug.split("/")[0].toLowerCase();

    for (const tier of ORG_TIERS) {
      for (const org of tier.orgs) {
        if (owner.includes(org) || org.includes(owner)) {
          if (tier.points > best.points) {
            best = { points: tier.points, label: tier.label };
          }
        }
      }
    }
  }

  return best;
}

// ─── Category C+D: Gemini LLM Scoring ───

interface OSGeminiResult {
  quantified_impact: {
    performance: { score: number; reasoning: string };
    scale_adoption: { score: number; reasoning: string };
    maintenance_quality: { score: number; reasoning: string };
    total: number;
  };
  technical_depth: {
    advanced_concepts: { score: number; reasoning: string };
    modern_stack: { score: number; reasoning: string };
    total: number;
  };
}

function buildOSPrompt(
  entry: NonNullable<SupabaseVettingData["openSource"]>[number],
  programTier: string,
  profileInfo: string
): string {
  return `You are evaluating a student's open source contributions for a resume screening system. Be fair but rigorous.

Program: ${entry.programName} (Tier: ${programTier})
GitHub Profile: ${entry.githubProfile}

Top 3 PRs:
1. ${entry.topPR1}
2. ${entry.topPR2}
3. ${entry.topPR3}

Impact claim: ${entry.impactDescription}
Impact PR link: ${entry.impactPRLink}
Months contributing: ${entry.monthsContributing}

${profileInfo}

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

Scoring rubric:
- performance (0-10): Latency/memory improvements, build time reductions, throughput gains, infra cost reduction
- scale_adoption (0-8): MAU, download counts, dependent packages, multi-org adoption
- maintenance_quality (0-7): Test coverage, bugs fixed, security fixes, refactors, documentation improvements
- advanced_concepts (0-10): Distributed systems, concurrency, caching, DB internals, compilers, systems programming, scalability
- modern_stack (0-5): Docker/K8s, cloud infra, REST/GraphQL, TypeScript, TDD, CI/CD, OAuth/JWT, security

Be conservative — most students score 8-20/40 for C+D combined. Only exceptional contributions reach above 25.`;
}

// ─── Main Scorer ───

export async function scoreOpenSource(
  data: SupabaseVettingData,
  weight: number
): Promise<CategoryScore> {
  const entries = data.openSource || [];

  if (entries.length === 0) {
    return {
      category: "open_source",
      raw: 0,
      maxRaw: MAX_RAW,
      normalized: 0,
      weight,
      weighted: 0,
      reasoning: "No open source contributions listed",
    };
  }

  // Take best single entry (most students have 1)
  // For multiple entries, we'll score the best program
  let bestTotal = 0;
  let bestReasoning = "";

  for (const entry of entries.slice(0, 3)) {
    // Category A: Program prestige
    const program = getProgramScore(entry.programName);

    // Category B: Org tier from PR URLs
    const prUrls = [entry.topPR1, entry.topPR2, entry.topPR3, entry.impactPRLink].filter(Boolean);
    const org = getOrgScore(prUrls);

    // Fetch GitHub profile data for Gemini context
    let profileInfo = "GitHub profile data: Not available";
    if (entry.githubProfile) {
      const profile = await fetchProfileData(entry.githubProfile);
      if (profile) {
        profileInfo = `GitHub profile data:
- Username: ${profile.username}
- Followers: ${profile.followers}, Public repos: ${profile.public_repos}
- Account created: ${profile.created_at}`;
      }
    }

    // Category C+D: Gemini scoring
    let catC = 0;
    let catD = 0;
    let geminiReasoning = "";

    try {
      const result = await geminiScoreJSON<OSGeminiResult>(
        buildOSPrompt(entry, program.tier, profileInfo)
      );

      catC = Math.min(
        (result.quantified_impact?.performance?.score ?? 0) +
        (result.quantified_impact?.scale_adoption?.score ?? 0) +
        (result.quantified_impact?.maintenance_quality?.score ?? 0),
        25
      );
      catD = Math.min(
        (result.technical_depth?.advanced_concepts?.score ?? 0) +
        (result.technical_depth?.modern_stack?.score ?? 0),
        15
      );

      geminiReasoning = `Impact:${catC}/25, Depth:${catD}/15`;
    } catch (err) {
      console.error(`[OpenSource] Gemini error:`, err);
      geminiReasoning = "Gemini scoring failed";
    }

    const total = Math.min(program.points + org.points + catC + catD, MAX_RAW);
    const reasoning = `Program "${entry.programName}" (${program.tier}):${program.points}/40. Org(${org.label}):${org.points}/30. ${geminiReasoning}. Total:${total}/${MAX_RAW}`;

    if (total > bestTotal) {
      bestTotal = total;
      bestReasoning = reasoning;
    }
  }

  const normalized = bestTotal / MAX_RAW;

  return {
    category: "open_source",
    raw: bestTotal,
    maxRaw: MAX_RAW,
    normalized,
    weight,
    weighted: Math.round(normalized * weight * 100) / 100,
    reasoning: bestReasoning,
  };
}
