import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { runAnalysis } from "../analysis/runAnalysis.js";
import { analysisInputSchema } from "../analysis/schema.js";

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
    try {
      return res.json(await runAnalysis(resumeText, jobText));
    } catch (error) {
      // The analysis function only includes provider status or schema field names,
      // never model output or submitted resume/job text.
      console.error(`[analysis] ${error.message}`);
      const status = Number.isInteger(error?.statusCode) ? error.statusCode : 502;
      const clientMessage =
        status === 429 ||
        status === 503 ||
        error.message.startsWith("Gemini API key") ||
        error.message.startsWith("Gemini API request was unauthorized")
          ? error.message
          : "The analysis service returned an invalid response. Please try again.";
      return res.status(status).json({
        message: clientMessage,
      });
    }
  },
);

export default router;
