// assets/js/interview-engine.js
/**
 * Core interview engine managing state and flow
 */

class InterviewEngine {
  constructor() {
    this.state = {
      config: {},
      questions: [],
      currentQuestion: 0,
      answers: [],
      evaluations: [],
      startTime: null,
      endTime: null,
      sessionId: Utils.generateId(),
    };

    this.eventListeners = new Map();
    this.init();
  }

  /**
   * Initialize the interview engine
   */
  init() {
    this.loadSavedState();
    this.setupEventListeners();
  }

  /**
   * Configure and start interview
   */
  async startInterview(config) {
    // Validate configuration
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`);
    }

    // Initialize state
    this.state.config = config;
    this.state.startTime = new Date();
    this.state.questions = await QuestionBank.generateQuestions(config);
    this.state.currentQuestion = 0;
    this.state.answers = [];
    this.state.evaluations = [];

    // Save state
    this.saveState();

    // Emit start event
    this.emit("interview:started", { config, questions: this.state.questions });

    return this.state.questions;
  }

  /**
   * Submit an answer (async when using LLM)
   */
  async submitAnswer(answer) {
    if (!answer || answer.trim().length === 0) {
      throw new Error("Answer cannot be empty");
    }

    const question = this.state.questions[this.state.currentQuestion];

    // Evaluate the answer
    let evaluation;
    if (typeof LLMService !== "undefined") {
      try {
        const llmEval = await LLMService.evaluateAnswer(
          question,
          answer,
          this.state.config
        );
        evaluation = {
          question_id: Utils.generateId(),
          question_text: question,
          candidate_answer: answer,
          score: typeof llmEval.score === "number" ? llmEval.score : 6.0,
          breakdown: llmEval.breakdown || {},
          feedback: llmEval.feedback || "No feedback provided.",
          improvements: llmEval.improvements || [],
          resources: llmEval.resources || [],
          analysis: llmEval.analysis || {},
        };
      } catch (e) {
        // Fallback to local scoring if LLM fails
        evaluation = ScoringSystem.evaluateAnswer(
          question,
          answer,
          this.state.config
        );
        evaluation.feedback = `LLM unavailable, used local scoring. ${evaluation.feedback}`;
      }
    } else {
      evaluation = ScoringSystem.evaluateAnswer(
        question,
        answer,
        this.state.config
      );
    }

    // Store answer and evaluation
    this.state.answers.push(answer);
    this.state.evaluations.push(evaluation);

    // Save state
    this.saveState();

    // Emit evaluation event
    this.emit("answer:evaluated", evaluation);

    return evaluation;
  }

  /**
   * Skip current question
   */
  skipQuestion() {
    const question = this.state.questions[this.state.currentQuestion];
    const skippedEvaluation = {
      question_id: Utils.generateId(),
      question_text: question,
      candidate_answer: "[SKIPPED]",
      score: 2.0,
      breakdown: {},
      feedback:
        "Question was skipped. Consider practicing similar questions to build confidence.",
      improvements: [
        "Practice similar questions",
        "Build confidence in this topic area",
      ],
      resources: ["Review fundamental concepts"],
      analysis: { skipped: true },
    };

    this.state.answers.push("[SKIPPED]");
    this.state.evaluations.push(skippedEvaluation);

    this.saveState();
    this.emit("question:skipped", skippedEvaluation);

    return skippedEvaluation;
  }

  /**
   * Move to next question
   */
  nextQuestion() {
    this.state.currentQuestion++;

    if (this.state.currentQuestion >= this.state.questions.length) {
      this.endInterview();
      return null;
    }

    this.saveState();
    this.emit("question:changed", {
      questionIndex: this.state.currentQuestion,
      question: this.getCurrentQuestion(),
      progress: this.getProgress(),
    });

    return this.getCurrentQuestion();
  }

  /**
   * End the interview
   */
  endInterview() {
    this.state.endTime = new Date();
    const summary = this.generateSummary();

    this.saveState();
    this.emit("interview:completed", summary);

    return summary;
  }

  /**
   * Get current question
   */
  getCurrentQuestion() {
    if (this.state.currentQuestion < this.state.questions.length) {
      return {
        index: this.state.currentQuestion,
        question: this.state.questions[this.state.currentQuestion],
        total: this.state.questions.length,
      };
    }
    return null;
  }

  /**
   * Get interview progress
   */
  getProgress() {
    return {
      current: this.state.currentQuestion,
      total: this.state.questions.length,
      percentage: Math.round(
        (this.state.currentQuestion / this.state.questions.length) * 100
      ),
    };
  }

  /**
   * Generate interview summary
   */
  generateSummary() {
    const evaluations = this.state.evaluations;
    const scores = evaluations.map((e) => e.score);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = scores.length > 0 ? totalScore / scores.length : 0;

    const duration = this.state.endTime - this.state.startTime;
    const durationMinutes = Math.round(duration / 60000);

    const summary = {
      sessionId: this.state.sessionId,
      config: this.state.config,
      totalScore: Math.round(averageScore * 10) / 10,
      questionCount: this.state.questions.length,
      answeredCount: evaluations.filter(
        (e) => e.candidate_answer !== "[SKIPPED]"
      ).length,
      skippedCount: evaluations.filter(
        (e) => e.candidate_answer === "[SKIPPED]"
      ).length,
      duration: durationMinutes,
      startTime: this.state.startTime,
      endTime: this.state.endTime,
      evaluations: evaluations,
      analysis: this.analyzePerformance(evaluations),
      recommendations: this.generateRecommendations(evaluations, averageScore),
    };

    return summary;
  }

  /**
   * Analyze overall performance
   */
  analyzePerformance(evaluations) {
    const scores = evaluations.map((e) => e.score);
    const validScores = scores.filter((s) => s > 2); // Exclude skipped questions

    if (validScores.length === 0) {
      const skippedCount = evaluations.filter(
        (e) => e.candidate_answer === "[SKIPPED]"
      ).length;
      const attemptedCount = evaluations.length - skippedCount;

      const strengths = [];
      const weaknesses = ["Multiple questions skipped"];

      // Even with poor performance, we can identify some positive aspects
      if (attemptedCount > 0) {
        strengths.push("Showed willingness to attempt questions");
      }
      if (
        evaluations.some(
          (e) => e.candidate_answer && e.candidate_answer.length > 20
        )
      ) {
        strengths.push("Provided detailed responses when attempting questions");
      }

      // Provide more meaningful labels for skipped interviews
      const trend =
        skippedCount === evaluations.length ? "all_skipped" : "incomplete";
      const consistency =
        attemptedCount === 0 ? "no_attempts" : "mixed_attempts";

      return {
        trend,
        consistency,
        strengths,
        weaknesses,
        averageScore: 0,
      };
    }

    // Calculate trend
    const firstHalf = validScores.slice(0, Math.ceil(validScores.length / 2));
    const secondHalf = validScores.slice(Math.ceil(validScores.length / 2));
    const firstAvg =
      firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
    const trend =
      secondAvg > firstAvg + 0.5
        ? "improving"
        : firstAvg > secondAvg + 0.5
          ? "declining"
          : "consistent";

    // Calculate consistency (standard deviation)
    const mean =
      validScores.reduce((sum, s) => sum + s, 0) / validScores.length;
    const variance =
      validScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
      validScores.length;
    const stdDev = Math.sqrt(variance);
    const consistency = stdDev < 1 ? "high" : stdDev < 2 ? "moderate" : "low";

    // Identify strengths and weaknesses
    const strengths = [];
    const weaknesses = [];

    const highScores = evaluations.filter((e) => e.score >= 7.5);
    const lowScores = evaluations.filter((e) => e.score < 5.5);
    const attemptedEvaluations = evaluations.filter(
      (e) => e.candidate_answer !== "[SKIPPED]"
    );

    if (highScores.length > evaluations.length * 0.6) {
      strengths.push("Consistently strong performance across questions");
    }

    if (evaluations.some((e) => e.analysis && e.analysis.hasStructure)) {
      strengths.push("Good answer structure and organization");
    }

    if (evaluations.some((e) => e.analysis && e.analysis.hasExamples)) {
      strengths.push("Effective use of examples and illustrations");
    }

    // Additional strength detection for lower scores
    if (attemptedEvaluations.length > 0) {
      const avgAttemptLength =
        attemptedEvaluations.reduce(
          (sum, e) => sum + (e.candidate_answer?.length || 0),
          0
        ) / attemptedEvaluations.length;
      if (avgAttemptLength > 50) {
        strengths.push("Provided comprehensive and detailed answers");
      }

      if (
        attemptedEvaluations.some(
          (e) => e.candidate_answer && e.candidate_answer.includes("example")
        )
      ) {
        strengths.push("Used examples to illustrate points");
      }

      if (
        attemptedEvaluations.some(
          (e) => e.candidate_answer && e.candidate_answer.includes("because")
        )
      ) {
        strengths.push("Demonstrated reasoning and explanation skills");
      }
    }

    if (lowScores.length > evaluations.length * 0.4) {
      weaknesses.push("Needs improvement in answer depth and detail");
    }

    const skippedCount = evaluations.filter(
      (e) => e.candidate_answer === "[SKIPPED]"
    ).length;
    if (skippedCount > 0) {
      weaknesses.push("Some questions skipped - work on building confidence");
    }

    // Ensure we always have at least one strength
    if (strengths.length === 0 && attemptedEvaluations.length > 0) {
      strengths.push("Completed the interview process");
    }

    return {
      trend,
      consistency,
      strengths,
      weaknesses,
      averageScore: mean,
      standardDeviation: stdDev,
    };
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(evaluations, averageScore) {
    const { mode, role, difficulty } = this.state.config;
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      resources: [],
    };

    // Immediate recommendations
    if (averageScore < 6) {
      recommendations.immediate.push(
        "Focus on understanding fundamental concepts before advanced topics"
      );
      recommendations.immediate.push(
        "Practice structuring your responses with clear beginning, middle, and end"
      );
    } else if (averageScore < 8) {
      recommendations.immediate.push(
        "Work on providing more comprehensive and detailed answers"
      );
      recommendations.immediate.push(
        "Include specific examples to support your points"
      );
    }

    // Short-term recommendations
    if (mode === "Technical") {
      recommendations.shortTerm.push(
        "Practice coding problems daily for 30-45 minutes"
      );
      recommendations.shortTerm.push(
        "Study system design principles and common patterns"
      );
      if (difficulty === "Hard") {
        recommendations.shortTerm.push(
          "Focus on scalability and performance optimization topics"
        );
      }
    } else {
      recommendations.shortTerm.push(
        "Practice the STAR method with various scenarios"
      );
      recommendations.shortTerm.push(
        "Prepare quantified examples of your achievements"
      );
    }

    // Long-term recommendations
    recommendations.longTerm.push(
      `Deepen expertise in ${role} domain knowledge`
    );
    recommendations.longTerm.push("Develop leadership and mentoring skills");
    recommendations.longTerm.push("Build a portfolio of challenging projects");

    // Resources based on performance
    if (averageScore < 5) {
      recommendations.resources.push(
        "Fundamental computer science concepts review"
      );
      recommendations.resources.push("Basic interview preparation courses");
    }

    recommendations.resources.push(
      ...ScoringSystem.generateResources(mode, difficulty, averageScore)
    );

    return recommendations;
  }

  /**
   * Validate configuration
   */
  validateConfig(config) {
    const required = ["role", "mode", "difficulty", "numQuestions"];
    const errors = [];

    required.forEach((field) => {
      if (!config[field]) {
        errors.push(`${field} is required`);
      }
    });

    if (
      config.numQuestions &&
      (config.numQuestions < 1 || config.numQuestions > 10)
    ) {
      errors.push("Number of questions must be between 1 and 10");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Save current state
   */
  saveState() {
    Utils.saveToStorage("interviewState", this.state);
  }

  /**
   * Load saved state
   */
  loadSavedState() {
    const savedState = Utils.loadFromStorage("interviewState");
    if (savedState && savedState.sessionId) {
      this.state = { ...this.state, ...savedState };
    }
  }

  /**
   * Clear saved state
   */
  clearState() {
    this.state = {
      config: {},
      questions: [],
      currentQuestion: 0,
      answers: [],
      evaluations: [],
      startTime: null,
      endTime: null,
      sessionId: Utils.generateId(),
    };
    Utils.saveToStorage("interviewState", null);
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => callback(data));
    }
  }

  setupEventListeners() {
    // Setup default event listeners
    this.on("interview:started", (data) => {
      console.log("Interview started:", data.config);
    });

    this.on("answer:evaluated", (evaluation) => {
      console.log("Answer evaluated:", evaluation.score);
    });

    this.on("interview:completed", (summary) => {
      console.log("Interview completed. Final score:", summary.totalScore);
    });
  }

  /**
   * Export interview data
   */
  exportData() {
    return {
      ...this.state,
      summary: this.state.endTime ? this.generateSummary() : null,
      exportedAt: new Date().toISOString(),
    };
  }
}
