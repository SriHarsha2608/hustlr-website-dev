/**
 * Internships Scorer — 30% Weight, 30 Raw Points
 *
 * Breakdown: Company Tier (15) + Role (10) + Duration (5)
 * Takes the BEST single qualifying experience.
 *
 * Employment types that count: Internship, Freelancing, Part time, Apprenticeship
 * Excluded: Self Employed
 * Freelancing is capped at tier 5-7 (startup tier)
 */

import { SupabaseVettingData } from "@/src/lib/schemas/formSchema";
import { CategoryScore } from "./types";

const MAX_RAW = 30;

const EXCLUDED_TYPES = ["self employed"];

// ─── Company Tier ───

/** Known big tech / global leaders → 14-15 pts */
const TIER_1: string[] = [
  "google", "microsoft", "apple", "amazon", "meta", "facebook", "nvidia",
  "netflix", "goldman sachs", "morgan stanley", "jpmorgan", "jp morgan",
  "tesla", "openai", "deepmind", "stripe", "uber", "airbnb", "bloomberg",
  "adobe", "salesforce", "palantir", "databricks", "snowflake", "coinbase",
  "bytedance", "tiktok", "intel", "qualcomm", "samsung", "ibm",
];

/** Established companies → 11-13 pts */
const TIER_2: string[] = [
  "oracle", "dell", "sap", "vmware", "cisco", "accenture", "deloitte",
  "infosys", "tcs", "wipro", "hcl", "cognizant", "capgemini",
  "atlassian", "shopify", "twilio", "cloudflare", "elastic",
  "servicenow", "workday", "intuit", "paypal", "visa", "mastercard",
  "american express", "amex", "ericsson", "siemens", "bosch",
  "philips", "samsung", "lg", "sony", "huawei", "lenovo",
  "flipkart", "swiggy", "zomato", "paytm", "phonepe", "dream11",
  "myntra", "nykaa", "zerodha",
];

/** Small tech / funded startups → 8-10 pts */
const TIER_3: string[] = [
  "cred", "meesho", "groww", "razorpay", "slice", "jupiter",
  "bharatpe", "unacademy", "upgrad", "byjus", "byju", "vedantu",
  "ola", "rapido", "dunzo", "postman", "hackerrank", "leetcode",
  "freshworks", "zoho", "chargebee", "browserstack",
  "cleartax", "smallcase", "lenskart", "urban company",
  "sharechat", "moj", "dailyhunt", "practo", "pharmeasy",
];

function getCompanyTier(company: string, isFreelancing: boolean): { points: number; tier: string } {
  // Freelancing is always capped at startup tier (5-7)
  if (isFreelancing) {
    return { points: 6, tier: "Freelancing (tier 5-7)" };
  }

  const lower = company.toLowerCase().trim();

  for (const name of TIER_1) {
    if (lower.includes(name)) return { points: 15, tier: "Big Tech / Global Leader" };
  }
  for (const name of TIER_2) {
    if (lower.includes(name)) return { points: 12, tier: "Established Company" };
  }
  for (const name of TIER_3) {
    if (lower.includes(name)) return { points: 9, tier: "Funded Startup / Small Tech" };
  }

  // Default: unknown company → startup tier
  return { points: 6, tier: "Small Startup / Unknown" };
}

// ─── Role Classification ───

const CORE_TECHNICAL_KEYWORDS: string[] = [
  "software", "sde", "developer", "engineer", "data analyst", "data scientist",
  "ml ", "machine learning", "backend", "frontend", "full stack", "fullstack",
  "devops", "cloud", "security", "researcher", "architect", "mobile developer",
  "ios developer", "android developer", "flutter", "react native",
];

const SEMI_TECHNICAL_KEYWORDS: string[] = [
  "product", "marketing", "analytics", "project", "design", "ui", "ux",
  "technical writer", "scrum", "agile", "qa", "quality", "testing",
  "business analyst", "consultant",
];

function getRoleScore(title: string, description: string): { points: number; type: string } {
  const text = `${title} ${description}`.toLowerCase();

  for (const kw of CORE_TECHNICAL_KEYWORDS) {
    if (text.includes(kw)) return { points: 10, type: "Core Technical" };
  }
  for (const kw of SEMI_TECHNICAL_KEYWORDS) {
    if (text.includes(kw)) return { points: 8, type: "Semi-Technical" };
  }
  return { points: 6, type: "Support / General" };
}

// ─── Duration ───

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function calcDurationMonths(
  startMonth: string, startYear: string,
  endMonth: string, endYear: string
): number {
  const smi = MONTHS.indexOf(startMonth.toLowerCase());
  const emi = MONTHS.indexOf(endMonth.toLowerCase());
  const sy = parseInt(startYear, 10);
  const ey = parseInt(endYear, 10);

  if (isNaN(sy) || isNaN(ey) || smi === -1 || emi === -1) return 1; // default to 1 month

  const months = (ey - sy) * 12 + (emi - smi);
  return Math.max(months, 0);
}

function getDurationScore(months: number): { points: number; label: string } {
  if (months >= 3) return { points: 5, label: `${months}mo (3+ months)` };
  if (months >= 2) return { points: 4, label: `${months}mo (2-3 months)` };
  return { points: 2, label: `${months}mo (1-2 months)` };
}

// ─── Main Scorer ───

export function scoreInternships(
  data: SupabaseVettingData,
  weight: number
): CategoryScore {
  const experiences = data.experiences || [];

  // Filter to qualifying types
  const qualifying = experiences.filter((exp) => {
    const type = (exp.employmentType || "").toLowerCase();
    return !EXCLUDED_TYPES.some((ex) => type.includes(ex));
  });

  if (qualifying.length === 0) {
    return {
      category: "internships",
      raw: 0,
      maxRaw: MAX_RAW,
      normalized: 0,
      weight,
      weighted: 0,
      reasoning: "No qualifying experiences (internship/freelancing/part-time)",
    };
  }

  // Score each and take the best
  let bestTotal = 0;
  let bestReasoning = "";

  for (const exp of qualifying) {
    const isFreelancing = (exp.employmentType || "").toLowerCase() === "freelancing";
    const company = getCompanyTier(exp.company, isFreelancing);
    const role = getRoleScore(exp.title, exp.description);
    const months = calcDurationMonths(exp.startMonth, exp.startYear, exp.endMonth, exp.endYear);
    const duration = getDurationScore(months);

    const total = company.points + role.points + duration.points;

    if (total > bestTotal) {
      bestTotal = total;
      bestReasoning = [
        `${exp.company} (${company.tier}) → ${company.points}/15`,
        `Role "${exp.title}" (${role.type}) → ${role.points}/10`,
        `Duration ${duration.label} → ${duration.points}/5`,
        `Total: ${total}/${MAX_RAW}`,
      ].join(". ");
    }
  }

  const normalized = bestTotal / MAX_RAW;

  return {
    category: "internships",
    raw: bestTotal,
    maxRaw: MAX_RAW,
    normalized,
    weight,
    weighted: normalized * weight,
    reasoning: `Best of ${qualifying.length} experience(s): ${bestReasoning}`,
  };
}
