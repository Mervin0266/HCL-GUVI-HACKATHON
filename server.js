// Minimal LLM proxy server
// Start with: OPENAI_API_KEY=your_key node server.js

const express = require("express");
const cors = require("cors");
// Ensure fetch is available on Node < 18
const fetch =
  global.fetch ||
  ((...args) => import("node-fetch").then(({ default: f }) => f(...args)));

const app = express();
const port = process.env.PORT || 8787;

// Optional local config fallback (config.js should not be committed)
let LOCAL_API_KEY = undefined;
try {
  // eslint-disable-next-line import/no-unresolved, global-require
  LOCAL_API_KEY = require("./config").OPENAI_API_KEY;
} catch (_) {
  // no local config present
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// LLM evaluation endpoint
app.post("/api/llm", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY || LOCAL_API_KEY;
    if (!apiKey) {
      return res
        .status(400)
        .json({ error: "Missing OPENAI_API_KEY on server" });
    }

    const { question, answer, config } = req.body || {};
    if (!question || !answer || !config) {
      return res
        .status(400)
        .json({ error: "Missing required fields: question, answer, config" });
    }

    // Use OpenRouter Chat Completions API
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          // OpenRouter recommends setting these for request validation
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "InterviewerGPT",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an interview evaluator. Return ONLY strict JSON with fields: score (0-10 number), breakdown (object), feedback (string), improvements (array of strings 3-6 items), resources (array of strings 2-5 items), analysis (object). Consider role, mode, difficulty. No prose outside JSON.`,
            },
            {
              role: "user",
              content: `Evaluate the candidate's answer.\nQuestion: ${question}\nAnswer: ${answer}\nConfig: ${JSON.stringify(config)}`,
            },
          ],
          temperature: 0.2,
        }),
      }
    );

    const rawEval = await response.text();
    if (!response.ok) {
      return res.status(502).json({ error: "LLM API error", details: rawEval });
    }

    let data;
    try {
      data = JSON.parse(rawEval);
    } catch (e) {
      return res
        .status(502)
        .json({ error: "Invalid JSON from LLM", details: rawEval });
    }
    // Chat Completions format
    let parsed;
    try {
      const content = data.choices?.[0]?.message?.content;
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch (e) {
      return res.status(500).json({
        error: "Failed to parse LLM JSON output",
        details: e.message,
        raw: data,
      });
    }

    return res.json({ ok: true, evaluation: parsed });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Server error", details: err.message });
  }
});

// LLM question generation endpoint
app.post("/api/questions", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY || LOCAL_API_KEY;
    if (!apiKey) {
      return res
        .status(400)
        .json({ error: "Missing OPENAI_API_KEY on server" });
    }

    const { role, mode, difficulty, numQuestions = 5, domain } = req.body || {};
    if (!role || !mode || !difficulty) {
      return res
        .status(400)
        .json({ error: "Missing required fields: role, mode, difficulty" });
    }

    // Debug logging
    console.log(
      `Generating questions - Role: ${role}, Mode: ${mode}, Difficulty: ${difficulty}, Domain: ${domain}`
    );

    // Normalize mode for comparison
    const normalizedMode = mode?.trim()?.toLowerCase();
    console.log(`Normalized mode: "${normalizedMode}"`);

    const sys = `You are an expert interview question generator. Return a strict JSON object with this exact shape: { "questions": string[] }. Each string is a single interview question. 

IMPORTANT MODE DISTINCTIONS:
- TECHNICAL questions: Focus on technical knowledge, coding, algorithms, system design, technical problem-solving, and domain expertise
- BEHAVIORAL questions: Focus on past experiences, soft skills, leadership, teamwork, conflict resolution, and STAR method responses

Tailor questions to the role, mode (Technical or Behavioral), difficulty (Easy/Medium/Hard), and optional domain. Avoid numbering and extra commentary.`;

    let usr;
    if (normalizedMode === "behavioral") {
      usr = `Generate ${numQuestions} BEHAVIORAL interview questions for role: ${role}. These should focus on past experiences, soft skills, leadership, teamwork, problem-solving in real situations, and STAR method responses. Difficulty: ${difficulty}. Domain: ${domain || "general"}. Examples: "Tell me about a time when...", "Describe a situation where...", "How did you handle...". Respond strictly as JSON with a top-level "questions" array.`;
    } else {
      usr = `Generate ${numQuestions} TECHNICAL interview questions for role: ${role}. These should focus on technical knowledge, coding, algorithms, system design, technical problem-solving, and domain-specific expertise. Difficulty: ${difficulty}. Domain: ${domain || "general"}. Examples: "How would you implement...", "Explain the difference between...", "Design a system that...". Respond strictly as JSON with a top-level "questions" array.`;
    }

    // Debug: Log the exact prompts being sent
    console.log("=== PROMPT DEBUG ===");
    console.log("System prompt:", sys);
    console.log("User prompt:", usr);
    console.log(
      "Mode check:",
      normalizedMode === "behavioral" ? "BEHAVIORAL MODE" : "TECHNICAL MODE"
    );
    console.log("===================");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "InterviewerGPT",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: usr },
          ],
          temperature: 0.4,
        }),
      }
    );

    const raw = await response.text();
    if (!response.ok) {
      return res.status(502).json({ error: "LLM API error", details: raw });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return res
        .status(502)
        .json({ error: "Invalid JSON from LLM", details: raw });
    }

    // Debug: Log the raw LLM response
    console.log("=== LLM RESPONSE DEBUG ===");
    console.log("Raw response:", raw);
    console.log("Parsed data:", data);
    console.log("==========================");
    let parsed;
    try {
      const content = data.choices?.[0]?.message?.content;
      parsed = typeof content === "string" ? JSON.parse(content) : content;
      const questions = Array.isArray(parsed?.questions)
        ? parsed.questions
        : Array.isArray(parsed)
          ? parsed
          : null;
      if (!questions)
        throw new Error("Missing questions array in JSON response");
    } catch (e) {
      return res.status(500).json({
        error: "Failed to parse questions JSON",
        details: e.message,
        raw: data,
      });
    }

    let questions = Array.isArray(parsed?.questions)
      ? parsed.questions
      : parsed;

    // Validate and filter questions based on mode
    if (normalizedMode === "behavioral") {
      questions = questions.filter(
        (q) =>
          q.toLowerCase().includes("tell me about") ||
          q.toLowerCase().includes("describe a time") ||
          q.toLowerCase().includes("situation") ||
          q.toLowerCase().includes("experience") ||
          q.toLowerCase().includes("how did you") ||
          q.toLowerCase().includes("challenge") ||
          q.toLowerCase().includes("conflict") ||
          q.toLowerCase().includes("team") ||
          q.toLowerCase().includes("leadership") ||
          q.toLowerCase().includes("mistake") ||
          q.toLowerCase().includes("failure") ||
          q.toLowerCase().includes("success")
      );
    } else if (normalizedMode === "technical") {
      questions = questions.filter(
        (q) =>
          q.toLowerCase().includes("implement") ||
          q.toLowerCase().includes("algorithm") ||
          q.toLowerCase().includes("design") ||
          q.toLowerCase().includes("code") ||
          q.toLowerCase().includes("system") ||
          q.toLowerCase().includes("database") ||
          q.toLowerCase().includes("api") ||
          q.toLowerCase().includes("optimize") ||
          q.toLowerCase().includes("complexity") ||
          q.toLowerCase().includes("architecture") ||
          q.toLowerCase().includes("how would you") ||
          q.toLowerCase().includes("explain") ||
          q.toLowerCase().includes("difference between")
      );
    }

    // If filtering removed too many questions, use original questions
    if (questions.length < Math.ceil(numQuestions / 2)) {
      console.log(
        `Warning: Filtering removed too many questions. Using original questions.`
      );
      questions = Array.isArray(parsed?.questions) ? parsed.questions : parsed;
    }

    // Debug: Log final questions
    console.log("=== FINAL QUESTIONS DEBUG ===");
    console.log("Mode:", mode, "(normalized:", normalizedMode, ")");
    console.log("Number of questions:", questions.length);
    console.log("Questions:", questions);
    console.log("=============================");

    return res.json({
      ok: true,
      questions: questions,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Server error", details: err.message });
  }
});

app.listen(port, () => {
  console.log(`LLM proxy server listening on http://localhost:${port}`);
});
