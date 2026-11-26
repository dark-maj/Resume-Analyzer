import { GoogleGenAI } from "@google/genai";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { keepSupportedMatches } from "../analysis/evidence.js";
import { buildAnalysisPrompt } from "../analysis/prompt.js";
import { analysisInputSchema, analysisResultSchema } from "../analysis/schema.js";

const router = Router();

router.post(
  "/",
  rateLimit({ windowMs: 60 * 1000, limit: 10 }),
  async (req, res) => {
    const input = analysisInputSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ message: "Provide non-empty resumeText and jobText, each no longer than 15000 characters." });
    }

    const { resumeText, jobText } = input.data;
    const prompt = buildAnalysisPrompt(resumeText, jobText);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const parsedJson = JSON.parse(response.text);
        const validated = analysisResultSchema.safeParse(parsedJson);

        if (validated.success) {
          return res.json(keepSupportedMatches(validated.data, resumeText));
        }
      } catch {
        // Retry once for model, JSON parsing, or response validation failures.
      }
    }

    return res.status(502).json({ message: "The analysis service returned an invalid response. Please try again." });
  },
);

export default router;
