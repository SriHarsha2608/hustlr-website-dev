/**
 * CGPA Scorer — 10% Weight, 10 Raw Points
 * 
 * Scoring table:
 *   9.0+    → 10 pts
 *   8.0–8.99 → 7 pts
 *   6.0–7.99 → 4 pts
 *   < 6.0   → 0 pts
 */

import { SupabaseVettingData } from "@/src/lib/schemas/formSchema";
import { CategoryScore } from "./types";

const MAX_RAW = 10;

function cgpaToPoints(cgpa: number): { points: number; reasoning: string } {
  if (cgpa >= 9.0) return { points: 10, reasoning: `CGPA ${cgpa} ≥ 9.0 → 10/10` };
  if (cgpa >= 8.0) return { points: 7, reasoning: `CGPA ${cgpa} ≥ 8.0 → 7/10` };
  if (cgpa >= 6.0) return { points: 4, reasoning: `CGPA ${cgpa} ≥ 6.0 → 4/10` };
  return { points: 0, reasoning: `CGPA ${cgpa} < 6.0 → 0/10` };
}

export function scoreCgpa(
  data: SupabaseVettingData,
  weight: number
): CategoryScore {
  const cgpa = typeof data.cgpa === "string" ? parseFloat(data.cgpa) : data.cgpa;
  const { points, reasoning } = cgpaToPoints(cgpa || 0);
  const normalized = points / MAX_RAW;

  return {
    category: "cgpa",
    raw: points,
    maxRaw: MAX_RAW,
    normalized,
    weight,
    weighted: normalized * weight,
    reasoning,
  };
}
