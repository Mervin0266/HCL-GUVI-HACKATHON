// assets/js/llm-service.js
/**
 * Service for calling the backend LLM proxy
 */

const LLMService = {
  /**
   * Evaluate an answer using the server-side LLM
   */
  async evaluateAnswer(question, answer, config) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const base = window.LLM_API_BASE || "http://localhost:8787";
      const res = await fetch(`${base}/api/llm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, config }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`LLM error: ${res.status} ${text}`);
      }
      const data = await res.json();
      return data.evaluation;
    } finally {
      clearTimeout(timeout);
    }
  },

  /**
   * Generate interview questions from LLM
   */
  async generateQuestions(config) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const base = window.LLM_API_BASE || "http://localhost:8787";

      // Debug logging
      console.log("Generating questions with config:", config);

      const res = await fetch(`${base}/api/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`LLM questions error: ${res.status} ${text}`);
      }
      const data = await res.json();

      // Debug logging
      console.log("Received questions:", data.questions);

      return Array.isArray(data.questions) ? data.questions : [];
    } finally {
      clearTimeout(timeout);
    }
  },
};
