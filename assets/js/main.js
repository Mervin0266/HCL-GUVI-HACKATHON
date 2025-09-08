// assets/js/main.js
/**
 * Main application controller
 */

class InterviewerGPT {
  constructor() {
    this.engine = new InterviewEngine();
    this.currentScreen = "setup";
    this.init();
  }

  /**
   * Initialize application
   */
  init() {
    this.setupTheme();
    this.setupEventListeners();
    this.initializeScreens();
    this.showScreen("setupScreen");

    // Check for saved state
    const savedState = Utils.loadFromStorage("interviewState");
    if (savedState && savedState.questions && savedState.questions.length > 0) {
      this.showResumeOption();
    }
  }

  /**
   * Setup theme management
   */
  setupTheme() {
    const savedTheme = Utils.loadFromStorage("theme", "light");
    document.body.setAttribute("data-theme", savedTheme);

    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.textContent = savedTheme === "light" ? "🌙" : "☀️";
      themeToggle.addEventListener("click", this.toggleTheme.bind(this));
    }
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    body.setAttribute("data-theme", newTheme);
    Utils.saveToStorage("theme", newTheme);

    const toggle = document.getElementById("themeToggle");
    toggle.textContent = newTheme === "light" ? "🌙" : "☀️";
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Engine events
    this.engine.on("interview:started", this.onInterviewStarted.bind(this));
    this.engine.on("answer:evaluated", this.onAnswerEvaluated.bind(this));
    this.engine.on("question:changed", this.onQuestionChanged.bind(this));
    this.engine.on("interview:completed", this.onInterviewCompleted.bind(this));

    // Global keyboard shortcuts
    document.addEventListener(
      "keydown",
      this.handleKeyboardShortcuts.bind(this)
    );
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Enter to submit answer
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      const submitBtn = document.querySelector(".btn-submit");
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
      }
    }

    // Escape to go back
    if (event.key === "Escape") {
      if (this.currentScreen === "interview") {
        // Show confirmation dialog
        if (confirm("Are you sure you want to exit the interview?")) {
          this.showScreen("setupScreen");
        }
      }
    }
  }

  /**
   * Initialize screens
   */
  initializeScreens() {
    // Initialize setup screen
    if (typeof SetupForm !== "undefined") {
      this.setupForm = new SetupForm(this.startInterview.bind(this));
    }

    // Initialize interview screen
    if (typeof InterviewPanel !== "undefined") {
      this.interviewPanel = new InterviewPanel({
        onSubmitAnswer: this.submitAnswer.bind(this),
        onSkipQuestion: this.skipQuestion.bind(this),
        onRetryQuestion: this.retryQuestion.bind(this),
      });
    }

    // Initialize feedback screen
    if (typeof FeedbackPanel !== "undefined") {
      this.feedbackPanel = new FeedbackPanel();
    }

    // Initialize summary screen
    if (typeof SummaryPanel !== "undefined") {
      this.summaryPanel = new SummaryPanel({
        onExportJSON: this.exportJSON.bind(this),
        onExportPDF: this.exportPDF.bind(this),
        onStartOver: this.startOver.bind(this),
      });
    }
  }

  /**
   * Show resume option if there's a saved state
   */
  showResumeOption() {
    // Auto-resume quietly without showing a blocking alert/confirm
    this.resumeInterview();
  }

  /**
   * Resume interview
   */
  resumeInterview() {
    const currentQuestion = this.engine.getCurrentQuestion();
    if (currentQuestion) {
      this.showScreen("interviewScreen");
      this.currentScreen = "interview";

      if (this.interviewPanel) {
        this.interviewPanel.loadQuestion(currentQuestion);
        this.interviewPanel.updateProgress(this.engine.getProgress());
      }
    }
  }

  /**
   * Start new interview
   */
  startInterview(config) {
    try {
      Utils.showLoading("Generating interview questions...");

      // Small delay to show loading
      setTimeout(async () => {
        try {
          await this.engine.startInterview(config);
        } catch (error) {
          Utils.hideLoading();
          alert(`Error starting interview: ${error.message}`);
        }
      }, 500);
    } catch (error) {
      Utils.hideLoading();
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Submit answer
   */
  async submitAnswer(answer) {
    try {
      Utils.showLoading("Evaluating your answer...");
      try {
        const evaluation = await this.engine.submitAnswer(answer);
        Utils.hideLoading();
        // Auto-advance after showing feedback
        setTimeout(() => {
          this.nextQuestion();
        }, 3000);
      } catch (error) {
        Utils.hideLoading();
        alert(`Error submitting answer: ${error.message}`);
      }
    } catch (error) {
      Utils.hideLoading();
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Skip question
   */
  skipQuestion() {
    // Skip without multiple popups
    this.engine.skipQuestion();
    this.nextQuestion();
  }

  /**
   * Retry question
   */
  retryQuestion() {
    if (this.interviewPanel) {
      this.interviewPanel.clearAnswer();
      this.feedbackPanel?.clearFeedback();
    }
  }

  /**
   * Next question
   */
  nextQuestion() {
    const nextQ = this.engine.nextQuestion();
    if (nextQ) {
      // Continue to next question
      if (this.interviewPanel) {
        this.interviewPanel.loadQuestion(nextQ);
        this.interviewPanel.updateProgress(this.engine.getProgress());
      }
    }
    // If no next question, interview:completed event will be fired
  }

  /**
   * Show screen
   */
  showScreen(screenId) {
    Utils.showScreen(screenId);
    this.currentScreen = screenId.replace("Screen", "");
  }

  /**
   * Event handlers
   */
  onInterviewStarted(data) {
    Utils.hideLoading();
    this.showScreen("interviewScreen");

    if (this.interviewPanel) {
      // Render the full interview interface
      this.interviewPanel.renderInterviewInterface();
      this.interviewPanel.setupInterviewEventListeners();

      const firstQuestion = this.engine.getCurrentQuestion();
      this.interviewPanel.loadQuestion(firstQuestion);
      this.interviewPanel.updateProgress(this.engine.getProgress());
      this.interviewPanel.displayConfig(data.config);
    }
  }

  onAnswerEvaluated(evaluation) {
    if (this.feedbackPanel) {
      this.feedbackPanel.showFeedback(evaluation);
    }
  }

  onQuestionChanged(data) {
    if (this.interviewPanel) {
      this.interviewPanel.loadQuestion(data);
      this.interviewPanel.updateProgress(data.progress);
    }
  }

  onInterviewCompleted(summary) {
    this.showScreen("summaryScreen");

    if (this.summaryPanel) {
      this.summaryPanel.displaySummary(summary);
    }
  }

  /**
   * Export functions
   */
  exportJSON() {
    const data = this.engine.exportData();
    const filename = `interview-results-${data.sessionId}-${Date.now()}.json`;
    Utils.exportJSON(data, filename);
  }

  exportPDF() {
    const summary = this.engine.generateSummary();
    this.generatePDFReport(summary);
  }

  generatePDFReport(summary) {
    const printWindow = window.open("", "_blank");
    const html = this.generatePDFHTML(summary);

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  generatePDFHTML(summary) {
    const { config, totalScore, analysis, recommendations } = summary;

    return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Interview Results - ${config.role}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; line-height: 1.6; color: #333; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0891b2; padding-bottom: 20px; }
                    .score { font-size: 48px; color: #0891b2; font-weight: bold; margin: 20px 0; }
                    .section { margin: 30px 0; page-break-inside: avoid; }
                    .section h3 { color: #0891b2; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px; }
                    .config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .config-item { margin-bottom: 10px; }
                    .config-label { font-weight: bold; color: #64748b; }
                    ul, ol { padding-left: 20px; }
                    li { margin: 8px 0; }
                    .performance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
                    .performance-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
                    .performance-value { font-size: 24px; font-weight: bold; color: #0891b2; }
                    @media print { 
                        body { margin: 20px; } 
                        .section { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>InterviewerGPT Results</h1>
                    <div class="score">${totalScore}/10</div>
                    <p>Overall Performance Score</p>
                </div>
                
                <div class="config-grid">
                    <div class="config-item"><span class="config-label">Role:</span> ${config.role}</div>
                    <div class="config-item"><span class="config-label">Mode:</span> ${config.mode}</div>
                    <div class="config-item"><span class="config-label">Difficulty:</span> ${config.difficulty}</div>
                    <div class="config-item"><span class="config-label">Questions:</span> ${config.numQuestions}</div>
                    <div class="config-item"><span class="config-label">Date:</span> ${Utils.formatDate(new Date(summary.startTime))}</div>
                    <div class="config-item"><span class="config-label">Duration:</span> ${summary.duration} minutes</div>
                </div>

                <div class="performance-grid">
                    <div class="performance-card">
                        <div class="performance-value">${summary.answeredCount}</div>
                        <div>Questions Answered</div>
                    </div>
                    <div class="performance-card">
                        <div class="performance-value">${analysis.consistency}</div>
                        <div>Consistency</div>
                    </div>
                    <div class="performance-card">
                        <div class="performance-value">${analysis.trend}</div>
                        <div>Performance Trend</div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>✓ Strengths</h3>
                    <ul>${analysis.strengths.map((s) => `<li>${s}</li>`).join("")}</ul>
                </div>
                
                <div class="section">
                    <h3>⚠ Areas for Improvement</h3>
                    <ul>${analysis.weaknesses.map((w) => `<li>${w}</li>`).join("")}</ul>
                </div>
                
                <div class="section">
                    <h3>📋 Immediate Actions</h3>
                    <ol>${recommendations.immediate.map((r) => `<li>${r}</li>`).join("")}</ol>
                </div>
                
                <div class="section">
                    <h3>📈 Short-term Goals</h3>
                    <ol>${recommendations.shortTerm.map((r) => `<li>${r}</li>`).join("")}</ol>
                </div>
                
                <div class="section">
                    <h3>🎯 Long-term Development</h3>
                    <ol>${recommendations.longTerm.map((r) => `<li>${r}</li>`).join("")}</ol>
                </div>
                
                <div class="section">
                    <h3>📚 Recommended Resources</h3>
                    <ul>${recommendations.resources.map((r) => `<li>${r}</li>`).join("")}</ul>
                </div>
                
                <div style="margin-top: 40px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p>Generated by InterviewerGPT • ${Utils.formatDate(new Date())}</p>
                </div>
            </body>
            </html>
        `;
  }

  /**
   * Start over
   */
  startOver() {
    const confirmation = confirm(
      "Are you sure you want to start a new interview? This will clear your current results."
    );
    if (confirmation) {
      this.engine.clearState();
      this.showScreen("setupScreen");

      // Reset forms
      if (this.setupForm) {
        this.setupForm.reset();
      }
    }
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new InterviewerGPT();
});
