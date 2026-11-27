import { GoogleGenAI } from "@google/genai";
import { keepSupportedMatches } from "./evidence.js";
import { buildAnalysisPrompt } from "./prompt.js";
import { analysisResultSchema } from "./schema.js";

class AnalysisError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.statusCode = statusCode;
  }
}

function classifyRequestError(error) {
  const rawMessage = typeof error?.message === "string" ? error.message : "";
  if (rawMessage.includes("API_KEY_INVALID") || rawMessage.includes("API key not valid")) {
    return new AnalysisError(
      "Gemini API key is invalid. Update GEMINI_API_KEY in server/.env and restart the backend.",
      502,
    );
  }
  if (error?.status === 401 || error?.status === 403) {
    return new AnalysisError(
      "Gemini API request was unauthorized. Check GEMINI_API_KEY permissions in server/.env.",
      502,
    );
  }
  if (error?.status === 429) {
    return new AnalysisError(
      "The AI analysis service is temporarily rate-limited. Please try again shortly.",
      429,
    );
  }
  if (error?.status === 503) {
    return new AnalysisError(
      "The AI analysis service is temporarily experiencing high demand. Please try again in a moment.",
      503,
    );
  }

  const details = [];
  if (Number.isInteger(error?.status)) details.push(`HTTP ${error.status}`);
  if (typeof error?.code === "string" && /^[a-z0-9_-]{1,40}$/i.test(error.code)) {
    details.push(error.code);
  }
  if (details.length === 0 && typeof error?.name === "string") {
    details.push(error.name.replace(/[^a-z0-9_-]/gi, "").slice(0, 40));
  }
  return new AnalysisError(
    `Gemini request failed${details.length ? ` (${details.join(", ")})` : ""}.`,
    502,
  );
}

export async function runAnalysis(resumeText, jobText) {
  const prompt = buildAnalysisPrompt(resumeText, jobText);
  let lastFailure = new AnalysisError("Gemini returned an invalid response.", 502);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0,
        },
      });
      let parsedJson;
      try {
        parsedJson = JSON.parse(response.text);
      } catch {
        lastFailure = new AnalysisError("Gemini returned invalid JSON.", 502);
        continue;
      }

      const validated = analysisResultSchema.safeParse(parsedJson);

      if (validated.success) {
        return keepSupportedMatches(validated.data, resumeText);
      }
      const invalidPaths = validated.error.issues
        .map(({ path }) => path.join("."))
        .filter(Boolean);
      lastFailure = new AnalysisError(
        invalidPaths.length
          ? `Gemini response failed schema validation (${invalidPaths.join(", ")}).`
          : "Gemini response failed schema validation.",
        502,
      );
    } catch (error) {
      lastFailure = classifyRequestError(error);
      if (
        error?.status === 400 ||
        error?.status === 401 ||
        error?.status === 403 ||
        error?.status === 429
      ) {
        break;
      }
    }
  }

  throw lastFailure;
}
