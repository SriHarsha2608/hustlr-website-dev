"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface CategoryScore {
  category: string;
  raw: number;
  maxRaw: number;
  normalized: number;
  weight: number;
  weighted: number;
  reasoning: string;
}

interface ScoringResult {
  scores: Record<string, CategoryScore>;
  weightedSum: number;
  totalWeight: number;
  finalScore: number;
  researchBoosted: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  cgpa: "CGPA",
  cp_platform: "CP Platform Rating",
  cp_competitions: "CP Competitions",
  research: "Research",
  skills: "Skills",
  internships: "Internships",
  projects: "Projects",
  hackathons: "Hackathons",
  open_source: "Open Source",
};

function scoreColor(pct: number): string {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 40) return "bg-yellow-500";
  if (pct >= 20) return "bg-orange-500";
  return "bg-red-500";
}

function scoreBadgeColor(score: number | undefined): string {
  if (score === undefined || score === null) return "bg-gray-100 text-gray-500";
  if (score >= 70) return "bg-emerald-100 text-emerald-700";
  if (score >= 40) return "bg-yellow-100 text-yellow-700";
  if (score >= 20) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

/** Compact score badge for the admin list page */
export function ScoreBadge({ score }: { score?: number | null }) {
  if (score === undefined || score === null) {
    return (
      <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500">
        Unscored
      </span>
    );
  }
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${scoreBadgeColor(score)}`}
    >
      {score.toFixed(1)}%
    </span>
  );
}

/** Full score breakdown card for the detail page */
export function ScoreBreakdown({
  scores,
  finalScore,
  researchBoosted,
  scoredAt,
}: {
  scores: Record<string, CategoryScore>;
  finalScore: number;
  researchBoosted: boolean;
  scoredAt?: string;
}) {
  const entries = Object.values(scores).sort((a, b) => b.weight - a.weight);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Score Breakdown</span>
          <span
            className={`text-2xl font-bold px-3 py-1 rounded ${scoreBadgeColor(finalScore)}`}
          >
            {finalScore.toFixed(1)}%
          </span>
        </CardTitle>
        {scoredAt && (
          <p className="text-sm text-gray-500" suppressHydrationWarning>
            Scored on {new Date(scoredAt).toLocaleString()}
          </p>
        )}
        {researchBoosted && (
          <p className="text-sm text-blue-600">
            Research weight boosted to 20% (field matches category)
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((s) => {
            const pct = s.normalized * 100;
            return (
              <div key={s.category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {CATEGORY_LABELS[s.category] || s.category}
                  </span>
                  <span className="text-gray-600">
                    {s.raw}/{s.maxRaw} · w{s.weight}% · {s.weighted.toFixed(1)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${scoreColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{s.reasoning}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/** Score action button + breakdown for the application detail page */
export function ScoreSection({
  email,
  jwtToken,
  initialScores,
  initialFinalScore,
  initialResearchBoosted,
  initialScoredAt,
}: {
  email: string;
  jwtToken: string;
  initialScores?: Record<string, CategoryScore> | null;
  initialFinalScore?: number | null;
  initialResearchBoosted?: boolean;
  initialScoredAt?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, CategoryScore> | null>(
    initialScores || null
  );
  const [finalScore, setFinalScore] = useState<number | null>(
    initialFinalScore ?? null
  );
  const [researchBoosted, setResearchBoosted] = useState(
    initialResearchBoosted ?? false
  );
  const [scoredAt, setScoredAt] = useState<string | null>(
    initialScoredAt || null
  );

  const handleScore = async (force?: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/scoreApplication", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        const result: ScoringResult = data.data;
        setScores(result.scores);
        setFinalScore(result.finalScore);
        setResearchBoosted(result.researchBoosted);
        setScoredAt(new Date().toISOString());
        toast.success(`Scored: ${result.finalScore.toFixed(1)}%`);
      } else {
        toast.error(data.error || "Scoring failed");
      }
    } catch {
      toast.error("Network error — scoring failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex gap-3">
        <Button
          onClick={() => handleScore(false)}
          disabled={loading}
          className="font-sans"
        >
          {loading
            ? "Scoring..."
            : scores
              ? "Re-score Application"
              : "Score Application"}
        </Button>
      </div>

      {scores && finalScore !== null && (
        <ScoreBreakdown
          scores={scores}
          finalScore={finalScore}
          researchBoosted={researchBoosted}
          scoredAt={scoredAt ?? undefined}
        />
      )}
    </div>
  );
}
