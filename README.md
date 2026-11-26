# HirePilot

HirePilot is a React + Vite frontend for matching a resume to a job description. The `server/` directory contains an Express API for PDF text extraction and a health check.

## Run the backend

```sh
cd server
npm install
cp .env.example .env
npm run dev
```

Set `ALLOWED_ORIGIN` to the exact origin serving the frontend (for local Vite, `http://localhost:5173`). The server defaults to port `3001` and accepts `PORT` from the environment. Check `GET http://localhost:3001/health`; submit one PDF as multipart form data under the field name `file` to `POST http://localhost:3001/api/extract`.

The API keeps uploads in memory, limits them to 5 MB, and returns extracted text only when at least 200 characters are found. Scanned or otherwise low-text PDFs receive a 422 response. Resume contents are not logged. The Gemini SDK dependency is included for future backend features; no Gemini calls are implemented yet.
