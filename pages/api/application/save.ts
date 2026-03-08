import type { NextApiRequest, NextApiResponse } from "next";
import {
  checkIfExists,
  extractEmailFromAuthHeader,
  getVettingProgress,
  insertVettingData,
  markAsComplete,
  prepareVettingData,
  updateVettingData,
} from "@/src/lib/vettingUtils";
import { verifyToken } from "@/src/lib/jwt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Support beacon requests (token passed as query param since beacon can't set headers)
  let jwtEmail = extractEmailFromAuthHeader(req);
  if (!jwtEmail && req.query.beacon === "true" && req.query.token) {
    try {
      const payload = verifyToken(req.query.token as string);
      jwtEmail = typeof payload === "string" ? null : payload.email;
    } catch {
      jwtEmail = null;
    }
  }

  if (!jwtEmail) {
    return res.status(401).json({ error: "Invalid or missing token" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (jwtEmail !== body.email) {
      return res.status(401).json({ error: "JWT and data email mismatch" });
    }

    // convert cgpa string to float
    const data = prepareVettingData(body);
    console.log("data to save: ", data);
    // check if some data already exists
    const existing = await checkIfExists(data.email);

    if (req.query.final === "true") {
      // Guard against duplicate final submissions
      if (existing) {
        const progress = await getVettingProgress(data.email);
        if (progress.success && progress.data?.isComplete) {
          return res.status(200).json({ success: true, final: true, alreadyComplete: true });
        }
      }
      await markAsComplete(data);
      return res.status(200).json({ success: true, final: true });
    }

    // Don't allow partial saves to overwrite a completed application
    // (e.g. beacon firing after tab close right after final submit)
    if (existing) {
      const progress = await getVettingProgress(data.email);
      if (progress.success && progress.data?.isComplete) {
        return res.status(200).json({ success: true, final: false, skipped: true });
      }
    }

    // For partial saves: explicitly set status and currentStage so users can
    // continue filling the form after logout/login. Without this, DB defaults
    // or stale values can show "application submitted" instead of the form.
    const partialData = {
      ...data,
      status: "not_completed" as const,
      currentStage: 1,
      isComplete: false,
    };

    if (existing) {
      await updateVettingData(partialData);
    } else {
      await insertVettingData(partialData);
    }

    return res.status(200).json({ success: true, final: false });
  } catch (error) {
    console.error("Error saving vetting data:", error);
    return res.status(500).json({ error: "Failed to save vetting data" });
  }
}
