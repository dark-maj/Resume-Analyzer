import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL?.trim() || "";
const baseURL = rawApiUrl.replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  timeout: 30000,
});

function ensureApiConfigured() {
  if (!baseURL) {
    throw new Error(
      "Backend API URL is not configured. Set VITE_API_URL in your .env file.",
    );
  }
}

export async function extractPdf(file) {
  ensureApiConfigured();
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/api/extract", formData);
  return response.data;
}

export async function analyze(resumeText, jobText) {
  ensureApiConfigured();
  const response = await api.post("/api/analyze", { resumeText, jobText });
  return response.data;
}
