import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/src/lib/jwt";

const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "admin@hustlr.local"
).toLowerCase();

function toStageStatus(statusLike: unknown): "pending" | "accepted" | "rejected" {
  const normalized = String(statusLike || "")
    .trim()
    .toLowerCase();
  if (normalized === "accepted") return "accepted";
  if (normalized === "rejected") return "rejected";
  return "pending";
}

function toPipelineStage(statusLike: unknown, currentStage: number) {
  const normalized = String(statusLike || "")
    .trim()
    .toLowerCase();

  if (normalized === "accepted") return "accepted";
  if (normalized === "rejected") return "rejected";
  if (
    normalized === "round_2_eligible" ||
    normalized === "round_2_project_selected" ||
    normalized === "round_2_under_review" ||
    currentStage >= 2
  ) {
    return "test_project";
  }
  return "resume_screening";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Missing or invalid authorization header",
    });
  }
  const token = authHeader.split(" ")[1];
  let payload: any;
  try {
    payload = verifyToken(token);
    const tokenEmail = String(payload?.email || "").toLowerCase();
    if (
      typeof payload === "string" ||
      payload.role !== "admin" ||
      tokenEmail !== ADMIN_EMAIL
    ) {
      return res
        .status(403)
        .json({ success: false, error: "Forbidden: Admin access required" });
    }
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }

  const {
    email,
    currentStage,
    status,
    decisionStatus,
    decisionSource,
    algorithmDecision,
  } = req.body || {};
  if (!email || !status || typeof currentStage !== "number") {
    return res.status(400).json({
      success: false,
      error: "email, status and currentStage are required",
    });
  }

  const baseUpdatePayload: Record<string, unknown> = {
    currentStage,
    status,
  };

  const extendedPayload: Record<string, unknown> = {
    ...baseUpdatePayload,
  };

  if (typeof decisionStatus === "string" && decisionStatus.trim()) {
    extendedPayload.decisionStatus = decisionStatus.trim();
  }
  if (typeof decisionSource === "string" && decisionSource.trim()) {
    extendedPayload.decisionSource = decisionSource.trim();
  }
  if (typeof algorithmDecision === "string" && algorithmDecision.trim()) {
    extendedPayload.algorithmDecision = algorithmDecision.trim();
  }

  const normalizedStageStatus = toStageStatus(decisionStatus || status);
  const normalizedDecisionSource = (
    typeof decisionSource === "string" && decisionSource.trim()
      ? decisionSource
      : "algorithm"
  ).trim();
  const normalizedPipelineStage = toPipelineStage(status, currentStage);

  extendedPayload.current_stage = normalizedPipelineStage;
  extendedPayload.stage_status = normalizedStageStatus;
  extendedPayload.decision_status =
    (typeof decisionStatus === "string" && decisionStatus.trim()) ||
    normalizedStageStatus;
  extendedPayload.decision_source = normalizedDecisionSource;
  extendedPayload.resume_decision =
    (typeof algorithmDecision === "string" && algorithmDecision.trim()) ||
    (typeof decisionStatus === "string" && decisionStatus.trim()) ||
    normalizedStageStatus;

  extendedPayload.decisionUpdatedAt = new Date().toISOString();
  if (payload?.email) {
    extendedPayload.decisionUpdatedBy = payload.email;
  }

  const updateWithPayload = async (payloadToSave: Record<string, unknown>) =>
    supabaseAdmin
      .from("vettingapplications")
      .update(payloadToSave)
      .eq("email", email)
      .select("*")
      .single();

  let { data, error } = await updateWithPayload(extendedPayload);

  const unknownColumnPattern =
    /column .* does not exist|could not find the .* column|schema cache/i;
  if (
    error &&
    Object.keys(extendedPayload).length > Object.keys(baseUpdatePayload).length &&
    unknownColumnPattern.test(error.message || "")
  ) {
    const fallback = await updateWithPayload(baseUpdatePayload);
    data = fallback.data;
    error = fallback.error;
    if (!error) {
      return res.status(200).json({
        success: true,
        data,
        warning:
          "Decision source/status columns are missing in DB. Stage and status were updated.",
      });
    }
  }

  if (error) return res.status(500).json({ success: false, error: error.message });

  return res.status(200).json({ success: true, data });
}
