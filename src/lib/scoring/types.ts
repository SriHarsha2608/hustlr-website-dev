/**
 * Shared types for the Hustlr Scoring Engine.
 */

import { SupabaseVettingData } from "@/src/lib/schemas/formSchema";

/** Result of a single category scorer */
export interface CategoryScore {
  /** Category identifier matching scoring_config.category */
  category: string;
  /** Raw points earned (e.g. 8 out of 10) */
  raw: number;
  /** Maximum possible raw points for this category */
  maxRaw: number;
  /** Normalized score: raw / maxRaw (0 to 1) */
  normalized: number;
  /** Weight applied from scoring_config (e.g. 30 for internships) */
  weight: number;
  /** Weighted contribution: normalized × weight */
  weighted: number;
  /** Human-readable explanation of how the score was derived */
  reasoning: string;
}

/** Weight config for a single category, as stored in scoring_config table */
export interface ScoringWeight {
  category: string;
  weight: number;
  enabled: boolean;
}

/** Full scoring result for one application */
export interface ScoringResult {
  /** Per-category scores */
  scores: Record<string, CategoryScore>;
  /** Sum of all weighted scores */
  weightedSum: number;
  /** Total denominator (sum of all enabled weights) */
  totalWeight: number;
  /** Final score scaled 0-100: (weightedSum / totalWeight) × 100 */
  finalScore: number;
  /** Whether research weight was boosted to 20% (field matched category) */
  researchBoosted: boolean;
}

/** Signature for a rule-based scorer function */
export type ScorerFn = (
  data: SupabaseVettingData,
  weight: number
) => CategoryScore;
