/**
 * Gemini LLM client for scoring.
 *
 * Sends structured prompts to gemini-2.5-flash and parses JSON responses.
 * Used by projects, hackathons, and open source scorers.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Send a prompt to Gemini and parse the JSON response.
 * Retries once on parse failure with a stricter prompt.
 */
export async function geminiScoreJSON<T>(prompt: string): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.1, // low temperature for consistent scoring
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    // Gemini sometimes wraps JSON in markdown fences
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      return JSON.parse(match[1]) as T;
    }
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }
}
