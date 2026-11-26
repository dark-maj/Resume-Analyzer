import React, { useRef, useState } from "react";
import { analyze, extractPdf } from "./api.js";

const MAX_TEXT_LENGTH = 15000;

const HOW_IT_WORKS_STEPS = [
  {
    step: "1",
    title: "Add your resume",
    description:
      "Upload a text-based PDF for in-memory extraction or paste your resume text directly.",
  },
  {
    step: "2",
    title: "Paste the job description",
    description:
      "Add the target role’s requirements so HirePilot can compare skills and experience.",
  },
  {
    step: "3",
    title: "Review your match",
    description:
      "Get a Gemini-powered match score, exact resume evidence quotes, and prioritized skill gaps.",
  },
];

const getErrorMessage = (error, fallback) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }
  if (error.code === "ERR_NETWORK") {
    return "Could not reach the API. Check that the backend is running and VITE_API_URL is correct.";
  }
  return error.message || fallback;
};

const App = () => {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [atsResume, setAtsResume] = useState("");
  const [creativeResume, setCreativeResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [extractStatus, setExtractStatus] = useState("idle");
  const [extractError, setExtractError] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState("idle");
  const [analysisError, setAnalysisError] = useState("");
  const [mockLoading, setMockLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");
  const [versions, setVersions] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeSource, setResumeSource] = useState("text"); // "text" or "pdf"
  const [fileInputKey, setFileInputKey] = useState(0);
  const workspaceRef = useRef(null);
  const resumeTextareaRef = useRef(null);

  const handleStartAnalysis = () => {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      resumeTextareaRef.current?.focus({ preventScroll: true });
    }, 250);
  };

  // Helper: fake delay for mock responses (while backend isn’t ready)
  const fakeDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const ensureInputs = () => {
    if (!resumeText.trim() || (!jobDescription.trim() && !jobUrl.trim())) {
      alert("Please add both resume text and job description/job link.");
      return false;
    }
    return true;
  };

  const handleExtractFromPdf = async () => {
    if (!resumeFile) {
      setExtractStatus("error");
      setExtractError("Select a PDF before extracting text.");
      return;
    }

    setExtractStatus("loading");
    setExtractError("");

    try {
      const result = await extractPdf(resumeFile);
      setResumeText(result.text || "");
      setResumeSource("pdf");
      setAnalysis(null);
      setAnalysisStatus("idle");
      setAnalysisError("");
      setExtractStatus("done");
    } catch (error) {
      setExtractError(
        getErrorMessage(error, "Could not extract text from the PDF. Try again."),
      );
      setExtractStatus("error");
    }
  };

  const handleAnalyzeFit = async () => {
    const trimmedResume = resumeText.trim();
    const trimmedJob = jobDescription.trim();

    if (!trimmedResume || !trimmedJob) {
      setAnalysis(null);
      setAnalysisStatus("error");
      setAnalysisError("Add both resume text and a job description before analyzing.");
      setActiveTab("analysis");
      return;
    }

    if (
      resumeText.length > MAX_TEXT_LENGTH ||
      jobDescription.length > MAX_TEXT_LENGTH
    ) {
      setAnalysis(null);
      setAnalysisStatus("error");
      setAnalysisError(
        `Resume and job description must each be ${MAX_TEXT_LENGTH.toLocaleString()} characters or fewer.`,
      );
      setActiveTab("analysis");
      return;
    }

    setAnalysisStatus("loading");
    setAnalysisError("");
    setActiveTab("analysis");

    try {
      const result = await analyze(resumeText, jobDescription);
      setAnalysis(result);
      setAnalysisStatus("done");
    } catch (error) {
      setAnalysis(null);
      setAnalysisError(
        getErrorMessage(error, "Analysis failed. Check the server and retry."),
      );
      setAnalysisStatus("error");
    }
  };

  const handleGenerateResumes = async () => {
    if (!ensureInputs()) return;
    setMockLoading(true);
    setActiveTab("ats");

    try {
      // TODO: Replace with backend call later:
      // const res = await axios.post(`${API_BASE}/agent/generate-resumes`, {
      //   resumeText,
      //   jobDescription,
      //   jobUrl,
      // });
      // setAtsResume(res.data.atsResume);
      // setCreativeResume(res.data.creativeResume);

      await fakeDelay(1200);

      const ats = `ATS-Optimized Resume

SUMMARY
Results-driven developer with experience in React, JavaScript, and cloud-based architectures. Skilled in building scalable, responsive user interfaces and integrating with AI-driven backends.

KEY SKILLS
- React, JavaScript, HTML, CSS
- REST APIs, JSON
- Git, GitHub, Agile
- GCP (Cloud Run, Firestore)

EXPERIENCE
- Built a portfolio of real-world projects including dashboards, planners, and agentic UIs.
- Collaborated on AI-backed features for resume and job optimization.`;

      const creative = `Creative Resume

Hey there! I'm a developer obsessed with turning ideas into working products. From AI-powered assistants to productivity dashboards, I ship fast and iterate even faster.

Highlights
• Designed and built multi-section frontends (React) with clean UX.
• Explored agentic systems using cloud + LLMs.
• Led small teams for college fests, handling both tech and coordination.

Tech I Love
React • JavaScript • GCP • APIs • Automation • AI`;

      setAtsResume(ats);
      setCreativeResume(creative);

      const newVersion = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        jobUrl: jobUrl || "Custom JD",
        tags: ["ATS", "Creative"],
      };
      setVersions((prev) => [newVersion, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Error generating resumes.");
    } finally {
      setMockLoading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!ensureInputs()) return;
    setMockLoading(true);
    setActiveTab("cover");

    try {
      // TODO: Replace with backend call later:
      // const res = await axios.post(`${API_BASE}/agent/generate-cover-letter`, {
      //   resumeText,
      //   jobDescription,
      //   jobUrl,
      // });
      // setCoverLetter(res.data.coverLetter);

      await fakeDelay(1000);

      const cl = `Dear Hiring Manager,

I am excited to apply for this role and believe my experience in React development, cloud platforms, and building AI-enhanced user experiences aligns strongly with your requirements.

In my recent projects, I have:
- Built responsive and intuitive frontends that integrate with AI/LLM-based backends.
- Worked with cloud-native architectures and modern deployment workflows.
- Focused heavily on usability, clarity, and performance.

I would love the opportunity to contribute to your team and grow with this role.

Sincerely,
[Your Name]`;

      setCoverLetter(cl);
    } catch (err) {
      console.error(err);
      alert("Error generating cover letter.");
    } finally {
      setMockLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-name">HirePilot</span>
          <span className="brand-tag">Resume-to-Job Match Analyzer</span>
        </div>
        <div className="header-actions">
          <button className="primary-btn" onClick={handleStartAnalysis}>
            Start Analysis
          </button>
          <button
            className="secondary-btn"
            onClick={() => {
              setResumeText("");
              setJobDescription("");
              setJobUrl("");
              setAnalysis(null);
              setAtsResume("");
              setCreativeResume("");
              setCoverLetter("");
              setVersions([]);
              setResumeFile(null);
              setResumeSource("text");
              setExtractStatus("idle");
              setExtractError("");
              setAnalysisStatus("idle");
              setAnalysisError("");
              setMockLoading(false);
              setFileInputKey((key) => key + 1);
            }}
          >
            Reset Session
          </button>
        </div>
      </header>

      <section className="landing" aria-label="Introduction">
        <div className="hero-card">
          <div className="hero-content">
            <span className="eyebrow">Evidence-backed resume matching</span>
            <h1>See how well your resume matches any job description</h1>
            <p className="hero-subtitle">
              Upload a PDF or paste your resume, add a job description, and get
              a Gemini-powered match score with exact resume quotes, missing
              skills ranked by importance, and suggested keywords.
            </p>
            <div className="hero-actions">
              <button className="primary-btn hero-cta" onClick={handleStartAnalysis}>
                Start Resume Analysis
              </button>
              <a className="secondary-btn hero-link" href="#how-it-works">
                How it works
              </a>
            </div>
          </div>

          <div className="availability-card">
            <div className="availability-group">
              <h3>
                <span className="status-dot status-dot-live" />
                Available now
              </h3>
              <ul>
                <li>Text-based PDF upload &amp; in-memory extraction</li>
                <li>Pasted resume &amp; job description matching</li>
                <li>Match score, resume evidence quotes &amp; skill gaps</li>
              </ul>
            </div>
            <div className="availability-group">
              <h3>
                <span className="status-dot status-dot-soon" />
                Coming soon (mock previews)
              </h3>
              <ul>
                <li>ATS &amp; Creative resume generation</li>
                <li>Tailored cover letter drafting</li>
                <li>Job URL fetching &amp; version history</li>
              </ul>
            </div>
          </div>
        </div>

        <div id="how-it-works" className="how-it-works">
          <div className="section-heading">
            <h2>How it works</h2>
            <p className="hint">Three quick steps from resume to actionable skill-gap feedback.</p>
          </div>
          <div className="steps-grid">
            {HOW_IT_WORKS_STEPS.map(({ step, title, description }) => (
              <article key={step} className="step-card">
                <span className="step-badge">{step}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <main id="analyzer-workspace" ref={workspaceRef} className="layout">
        {/* Left column – Resume */}
        <section className="card">
          <h2>Your Resume</h2>
          <p className="hint">
            Upload a PDF or paste your resume text. If you upload a PDF, click{" "}
            <b>Extract from PDF</b> to convert it to text.
          </p>

          {/* PDF upload */}
          <div style={{ marginBottom: "8px" }}>
            <input
              key={fileInputKey}
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setResumeFile(file || null);
                if (file) {
                  setResumeSource("pdf");
                  setResumeText("");
                  setAnalysis(null);
                  setAnalysisStatus("idle");
                  setAnalysisError("");
                  setExtractStatus("idle");
                  setExtractError("");
                }
              }}
            />
            {resumeFile && (
              <p className="hint">
                Selected: <b>{resumeFile.name}</b>{" "}
                ({(resumeFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <button
              className="secondary-btn"
              style={{ marginTop: "4px" }}
              onClick={handleExtractFromPdf}
              disabled={!resumeFile || extractStatus === "loading"}
            >
              {extractStatus === "loading"
                ? "Extracting from PDF..."
                : extractStatus === "error"
                  ? "Retry extraction"
                  : "Extract from PDF"}
            </button>
            {extractStatus === "loading" && (
              <p className="status-message" role="status">Extracting PDF text…</p>
            )}
            {extractStatus === "done" && (
              <p className="status-message status-success" role="status">
                Text extracted. Review or edit it below before analysis.
              </p>
            )}
            {extractStatus === "error" && (
              <p className="status-message status-error" role="alert">{extractError}</p>
            )}
          </div>

          {/* Resume text area */}
          <textarea
            ref={resumeTextareaRef}
            className="textarea"
            placeholder="Paste your resume here, or extract it from a PDF above..."
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              setResumeSource("text");
              setAnalysis(null);
              setAnalysisStatus("idle");
              setAnalysisError("");
            }}
          />
          <div className="field-meta">
            <span className="hint">
              {resumeSource === "pdf" && extractStatus === "done"
                ? "Extracted resume text is editable. Changes will be used for analysis."
                : "Supports pasted text or extracted PDF text."}
            </span>
            <span
              className={`char-count ${resumeText.length > MAX_TEXT_LENGTH ? "char-count-over" : ""}`}
            >
              {resumeText.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
            </span>
          </div>
        </section>

        {/* Middle column – Job Info */}
        <section className="card">
          <h2>Job Description</h2>
          <input
            className="input"
            type="text"
            placeholder="Job link (optional, e.g., https://careers.spotify.com/...)"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
          />
          <p className="hint">Job link fetching is coming soon. Paste the job description below to analyze it.</p>
          <textarea
            className="textarea"
            placeholder="Paste job description here..."
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              setAnalysis(null);
              setAnalysisStatus("idle");
              setAnalysisError("");
            }}
          />
          <div className="field-meta">
            <span className="hint">Required for match analysis.</span>
            <span
              className={`char-count ${jobDescription.length > MAX_TEXT_LENGTH ? "char-count-over" : ""}`}
            >
              {jobDescription.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
            </span>
          </div>

          <div className="btn-row">
            <button
              className="secondary-btn"
              onClick={handleAnalyzeFit}
              disabled={analysisStatus === "loading"}
            >
              {analysisStatus === "loading"
                ? "Analyzing..."
                : "Analyze Fit"}
            </button>
            <button
              className="primary-btn"
              onClick={handleGenerateResumes}
              disabled={mockLoading}
            >
              {mockLoading && activeTab === "ats"
                ? "Generating Resumes..."
                : "Generate Resumes"}
            </button>
            <button
              className="secondary-btn"
              onClick={handleGenerateCoverLetter}
              disabled={mockLoading}
            >
              {mockLoading && activeTab === "cover"
                ? "Writing Cover Letter..."
                : "Generate Cover Letter"}
            </button>
          </div>
        </section>

        {/* Right column – Results */}
        <section className="card">
          <div className="tabs">
            <button
              className={`tab-btn ${
                activeTab === "analysis" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("analysis")}
            >
              Analysis
            </button>
            <button
              className={`tab-btn ${
                activeTab === "ats" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("ats")}
            >
              Resumes (coming soon)
            </button>
            <button
              className={`tab-btn ${
                activeTab === "cover" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("cover")}
            >
              Cover Letter (coming soon)
            </button>
            <button
              className={`tab-btn ${
                activeTab === "history" ? "tab-active" : ""
              }`}
              onClick={() => setActiveTab("history")}
            >
              History (coming soon)
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "analysis" && (
              <div>
                <h3>Job–Resume Match Analysis</h3>
                {analysisStatus === "idle" && (
                  <p className="hint">
                    Click <b>Analyze Fit</b> to compare your resume with the job description.
                  </p>
                )}
                {analysisStatus === "loading" && (
                  <p className="status-message" role="status">Analyzing resume and job description…</p>
                )}
                {analysisStatus === "error" && (
                  <div>
                    <p className="status-message status-error" role="alert">{analysisError}</p>
                    <button className="secondary-btn" onClick={handleAnalyzeFit}>Retry analysis</button>
                  </div>
                )}
                {analysisStatus === "done" && analysis && (
                  <>
                    <p className="status-message status-success" role="status">
                      Analysis complete.
                    </p>
                    <p className="score">
                      Match Score: <span>{analysis.score}%</span>
                    </p>
                    <h4>Matched Skills</h4>
                    {analysis.matched.length ? (
                      <ul className="analysis-list">
                        {analysis.matched.map(({ skill, evidence }, i) => (
                          <li className="match-item" key={`${skill}-${i}`}>
                            <strong>{skill}</strong>
                            <blockquote className="evidence-quote">“{evidence}”</blockquote>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="hint">No matching skills were identified.</p>}

                    <h4>Missing Skills</h4>
                    {analysis.missing.length ? (
                      <ul className="missing-list">
                        {analysis.missing.map(({ skill, importance }, i) => (
                          <li className="missing-item" key={`${skill}-${i}`}>
                            <span>{skill}</span>
                            <span className={`importance-pill importance-${importance}`}>{importance} importance</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="hint">No missing skills identified.</p>}

                    <h4>Suggested Skills</h4>
                    {analysis.suggested.length ? (
                      <div className="chips">
                        {analysis.suggested.map((skill, i) => <span key={`${skill}-${i}`} className="chip">{skill}</span>)}
                      </div>
                    ) : <p className="hint">No additional skills suggested.</p>}
                  </>
                )}
              </div>
            )}

            {activeTab === "ats" && (
              <div className="split">
                <div className="split-column">
                  <h3>ATS Resume <span className="coming-soon">Coming soon</span></h3>
                  <p className="hint">Mock preview. Connected resume generation is coming soon.</p>
                  {!atsResume && (
                    <p className="hint">
                      Click <b>Generate Resumes</b> to create an ATS-optimized
                      version.
                    </p>
                  )}
                  <pre className="code-block">{atsResume}</pre>
                </div>
                <div className="split-column">
                  <h3>Creative / Recruiter Resume <span className="coming-soon">Coming soon</span></h3>
                  <pre className="code-block">{creativeResume}</pre>
                </div>
              </div>
            )}

            {activeTab === "cover" && (
              <div>
                <h3>Cover Letter <span className="coming-soon">Coming soon</span></h3>
                <p className="hint">Mock preview. Connected cover letter generation is coming soon.</p>
                {!coverLetter && (
                  <p className="hint">
                    Click <b>Generate Cover Letter</b> after adding resume +
                    job.
                  </p>
                )}
                <pre className="code-block">{coverLetter}</pre>
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <h3>Generated Versions History <span className="coming-soon">Coming soon</span></h3>
                {versions.length === 0 ? (
                  <p className="hint">
                    Once you generate resumes, they’ll show up here with
                    timestamps.
                  </p>
                ) : (
                  <ul className="history-list">
                    {versions.map((v) => (
                      <li key={v.id} className="history-item">
                        <div>
                          <p className="history-job">{v.jobUrl}</p>
                          <p className="history-time">{v.timestamp}</p>
                        </div>
                        <div className="history-tags">
                          {v.tags.map((t) => (
                            <span key={t} className="chip">
                              {t}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
