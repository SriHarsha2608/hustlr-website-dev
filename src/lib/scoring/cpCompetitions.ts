/**
 * CP Competitions Scorer — 15% Weight, 15 Raw Points
 *
 * Rule: best single competition achievement from cpCompetitions[]
 *
 * Uses keyword matching on competition name + achievement text.
 */

import { SupabaseVettingData } from "@/src/lib/schemas/formSchema";
import { CategoryScore } from "./types";

const MAX_RAW = 15;

interface CompetitionEntry {
  name: string;
  achievement: string;
}

/**
 * Score a single competition entry based on name + achievement keywords.
 * Returns points (0-15) and a short explanation.
 */
function scoreCompetition(entry: CompetitionEntry): { points: number; label: string } {
  const name = entry.name.toLowerCase();
  const achievement = entry.achievement.toLowerCase();

  const isICPC = name.includes("icpc") || name.includes("international collegiate");
  const isGCJ = name.includes("code jam") || name.includes("codejam");
  const isHackerCup = name.includes("hacker cup") || name.includes("hackercup") || name.includes("meta hacker");
  const isKickstart = name.includes("kickstart") || name.includes("kick start") || name.includes("hash code") || name.includes("hashcode");
  const isNational = name.includes("national") || name.includes("india") || name.includes("ioi");

  // Check achievement level keywords
  const isWorldFinals = achievement.includes("world final") || achievement.includes("world-final");
  const isQualifiedWF = isWorldFinals && (achievement.includes("qualified") || achievement.includes("qualify"));
  const isParticipatedWF = isWorldFinals && !isQualifiedWF;
  const isRegional = achievement.includes("regional");
  const isTop10 = achievement.includes("top 10") || achievement.includes("top10") || achievement.includes("top-10");
  const isTop3 = achievement.includes("top 3") || achievement.includes("top3") || achievement.includes("top-3")
    || achievement.includes("winner") || achievement.includes("1st") || achievement.includes("2nd") || achievement.includes("3rd")
    || achievement.includes("gold") || achievement.includes("silver") || achievement.includes("bronze");
  const isAdvanced = achievement.includes("advanced") || achievement.includes("round 2") || achievement.includes("round 3")
    || achievement.includes("finalist") || achievement.includes("semi-final") || achievement.includes("semifinal");
  const isPrelim = achievement.includes("prelim") || achievement.includes("qualified") || achievement.includes("qualify")
    || achievement.includes("cleared") || achievement.includes("selected");
  const isParticipated = achievement.includes("participated") || achievement.includes("participation")
    || achievement.includes("competed") || achievement.includes("attempted");

  // --- ICPC ---
  if (isICPC) {
    if (isParticipatedWF) return { points: 15, label: "ICPC World Finals — participated" };
    if (isQualifiedWF) return { points: 13, label: "ICPC World Finals — qualified" };
    if (isWorldFinals) return { points: 15, label: "ICPC World Finals" };
    if (isRegional && isTop10) return { points: 12, label: "ICPC Regional — Top 10" };
    if (isRegional && isTop3) return { points: 12, label: "ICPC Regional — Top 3" };
    if (isRegional) return { points: 8, label: "ICPC Regional — participated" };
    if (isPrelim) return { points: 5, label: "ICPC Preliminary — qualified" };
    if (isParticipated) return { points: 2, label: "ICPC — participated" };
    // Default: if they mention ICPC, at least prelim level
    return { points: 5, label: "ICPC — qualification level (default)" };
  }

  // --- Google Code Jam / Meta Hacker Cup ---
  if (isGCJ || isHackerCup) {
    if (isAdvanced || isTop3) return { points: 12, label: `${isGCJ ? "Google Code Jam" : "Meta Hacker Cup"} — advanced rounds` };
    if (isPrelim) return { points: 6, label: `${isGCJ ? "Google Code Jam" : "Meta Hacker Cup"} — qualified` };
    return { points: 4, label: `${isGCJ ? "Google Code Jam" : "Meta Hacker Cup"} — participated` };
  }

  // --- Google Kickstart / Hash Code ---
  if (isKickstart) {
    if (isTop3 || isAdvanced) return { points: 9, label: "Google Kickstart/Hash Code — top ranks" };
    return { points: 4, label: "Google Kickstart/Hash Code — participated" };
  }

  // --- National-level ---
  if (isNational) {
    if (isTop3) return { points: 10, label: "National competition — Winner/Top 3" };
    return { points: 4, label: "National competition — participated" };
  }

  // --- Any other CP competition ---
  if (isTop3) return { points: 6, label: `${entry.name} — Top 3` };
  if (isAdvanced) return { points: 6, label: `${entry.name} — advanced/finalist` };
  if (isPrelim) return { points: 4, label: `${entry.name} — qualified` };
  if (isParticipated) return { points: 2, label: `${entry.name} — participated` };

  // Fallback: they listed it, give minimal credit
  return { points: 2, label: `${entry.name} — participation (default)` };
}

export function scoreCpCompetitions(
  data: SupabaseVettingData,
  weight: number
): CategoryScore {
  const competitions = data.cpCompetitions || [];

  if (data.hasQualifiedCpCompetitions === "No" || competitions.length === 0) {
    return {
      category: "cp_competitions",
      raw: 0,
      maxRaw: MAX_RAW,
      normalized: 0,
      weight,
      weighted: 0,
      reasoning: "No CP competitions listed",
    };
  }

  let bestPoints = 0;
  let bestLabel = "";

  for (const comp of competitions) {
    const { points, label } = scoreCompetition(comp);
    if (points > bestPoints) {
      bestPoints = points;
      bestLabel = label;
    }
  }

  const normalized = bestPoints / MAX_RAW;

  return {
    category: "cp_competitions",
    raw: bestPoints,
    maxRaw: MAX_RAW,
    normalized,
    weight,
    weighted: normalized * weight,
    reasoning: `Best: ${bestLabel} (${bestPoints}/${MAX_RAW}). ${competitions.length} total competition(s).`,
  };
}
