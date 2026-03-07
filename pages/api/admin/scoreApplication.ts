import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/src/lib/jwt";
import { scoreAndSave } from "@/src/lib/scoring/engine";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // ─── Auth: same pattern as other admin routes ───
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
    if (typeof payload === "string" || payload.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, error: "Forbidden: Admin access required" });
    }
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }

  // ─── Input validation ───
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ success: false, error: "email is required" });
  }

  // ─── Score the application ───
  try {
    const result = await scoreAndSave(email);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[scoreApplication] Error scoring ${email}:`, message);
    return res.status(500).json({ success: false, error: message });
  }
}
