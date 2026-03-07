/**
 * CP Platform Scorer — 15% Weight, 15 Raw Points
 *
 * Rule: max(codeforces_score, codechef_score)
 *
 * Codeforces:  2000+ → 15 | 1800+ → 13 | 1600+ → 9 | 1400+ → 5 | 1200+ → 2 | <1200 → 0
 * CodeChef:    2200+ → 15 | 2000+ → 13 | 1800+ → 9 | 1600+ → 5 | 1400+ → 2 | <1400 → 0
 */

import { SupabaseVettingData } from "@/src/lib/schemas/formSchema";
import { CategoryScore } from "./types";

const MAX_RAW = 15;

function cfScore(rating: number): number {
  if (rating >= 2000) return 15;
  if (rating >= 1800) return 13;
  if (rating >= 1600) return 9;
  if (rating >= 1400) return 5;
  if (rating >= 1200) return 2;
  return 0;
}

function ccScore(rating: number): number {
  if (rating >= 2200) return 15;
  if (rating >= 2000) return 13;
  if (rating >= 1800) return 9;
  if (rating >= 1600) return 5;
  if (rating >= 1400) return 2;
  return 0;
}

export function scoreCpPlatform(
  data: SupabaseVettingData,
  weight: number
): CategoryScore {
  const cfRating = data.codeforcesRating ? parseInt(data.codeforcesRating, 10) : 0;
  const ccRating = data.codechefRating ? parseInt(data.codechefRating, 10) : 0;

  const cfPts = cfRating > 0 ? cfScore(cfRating) : 0;
  const ccPts = ccRating > 0 ? ccScore(ccRating) : 0;
  const points = Math.max(cfPts, ccPts);

  const parts: string[] = [];
  if (cfRating > 0) parts.push(`CF ${cfRating} → ${cfPts}pts`);
  if (ccRating > 0) parts.push(`CC ${ccRating} → ${ccPts}pts`);
  if (parts.length === 0) parts.push("No CP ratings provided");
  const reasoning = `${parts.join(", ")}. max = ${points}/${MAX_RAW}`;

  const normalized = points / MAX_RAW;

  return {
    category: "cp_platform",
    raw: points,
    maxRaw: MAX_RAW,
    normalized,
    weight,
    weighted: normalized * weight,
    reasoning,
  };
}
