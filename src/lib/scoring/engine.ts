/**
 * Scoring Engine Orchestrator
 *
 * Runs all scorers (rule-based + Gemini/GitHub async), applies weights from
 * scoring_config table, handles dynamic research weight, computes final score.
 */

import { SupabaseVettingData } from "@/src/lib/schemas/formSchema";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { CategoryScore, ScoringResult, ScoringWeight } from "./types";
import { scoreCgpa } from "./cgpa";
import { scoreCpPlatform } from "./cpPlatform";
import { scoreCpCompetitions } from "./cpCompetitions";
import { scoreResearch, isResearchFieldMatch } from "./research";
import { scoreSkills } from "./skills";
import { scoreInternships } from "./internships";
import { scoreProjects } from "./projects";
import { scoreHackathons } from "./hackathons";
import { scoreOpenSource } from "./openSource";

/** Fetch weights from scoring_config table */
export async function fetchWeights(): Promise<ScoringWeight[]> {
  const { data, error } = await supabaseAdmin
    .from("scoring_config")
    .select("category, weight, enabled")
    .order("weight", { ascending: false });

  if (error) throw new Error(`Failed to fetch scoring config: ${error.message}`);
  return data as ScoringWeight[];
}

/** Get weight for a specific category, or 0 if disabled */
function getWeight(weights: ScoringWeight[], category: string): number {
  const entry = weights.find((w) => w.category === category);
  if (!entry || !entry.enabled) return 0;
  return entry.weight;
}

/**
 * Run all rule-based scorers on an application.
 * Returns complete ScoringResult with per-category breakdown + final score.
 */
export async function scoreApplication(
  data: SupabaseVettingData
): Promise<ScoringResult> {
  const weights = await fetchWeights();

  // Determine dynamic research weight
  const papers = data.researchPapers || [];
  const researchBoosted = isResearchFieldMatch(data.category, papers);
  const researchDefaultWeight = getWeight(weights, "research");
  const researchWeight = researchBoosted
    ? researchDefaultWeight // Use the config weight (default 20)
    : Math.min(researchDefaultWeight, 5); // Cap at 5 if no field match

  // Run all rule-based scorers
  const scores: Record<string, CategoryScore> = {};

  scores.cgpa = scoreCgpa(data, getWeight(weights, "cgpa"));
  scores.cp_platform = scoreCpPlatform(data, getWeight(weights, "cp_platform"));
  scores.cp_competitions = scoreCpCompetitions(data, getWeight(weights, "cp_competitions"));
  scores.research = scoreResearch(data, researchWeight);
  scores.skills = scoreSkills(data, getWeight(weights, "skills"));
  scores.internships = scoreInternships(data, getWeight(weights, "internships"));

  // Async scorers (Gemini + GitHub API)
  const [projectsResult, hackathonsResult, openSourceResult] = await Promise.all([
    scoreProjects(data, getWeight(weights, "projects")),
    scoreHackathons(data, getWeight(weights, "hackathons")),
    scoreOpenSource(data, getWeight(weights, "open_source")),
  ]);

  scores.projects = projectsResult;
  scores.hackathons = hackathonsResult;
  scores.open_source = openSourceResult;

  // Calculate totals
  let weightedSum = 0;
  let totalWeight = 0;

  for (const score of Object.values(scores)) {
    weightedSum += score.weighted;
    totalWeight += score.weight;
  }

  const finalScore = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 100 * 100) / 100 // 2 decimal places
    : 0;

  return {
    scores,
    weightedSum: Math.round(weightedSum * 100) / 100,
    totalWeight,
    finalScore,
    researchBoosted,
  };
}

/**
 * Score an application and save results to the database.
 */
export async function scoreAndSave(email: string): Promise<ScoringResult> {
  // Fetch application data
  const { data: appData, error: fetchError } = await supabaseAdmin
    .from("vettingapplications")
    .select("*")
    .eq("email", email)
    .single();

  if (fetchError || !appData) {
    throw new Error(`Application not found for ${email}`);
  }

  const result = await scoreApplication(appData as SupabaseVettingData);

  // Save scores to DB
  const { error: updateError } = await supabaseAdmin
    .from("vettingapplications")
    .update({
      scores: result.scores,
      final_score: result.finalScore,
      scored_at: new Date().toISOString(),
    })
    .eq("email", email);

  if (updateError) {
    throw new Error(`Failed to save scores: ${updateError.message}`);
  }

  return result;
}
