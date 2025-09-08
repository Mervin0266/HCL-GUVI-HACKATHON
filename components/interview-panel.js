// components/interview-panel.js
/**
 * Interview panel component for questions and answers
 */

class InterviewPanel {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.currentQuestion = null;
    this.isSubmitted = false;
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const interviewScreen = document.getElementById("interviewScreen");
    if (!interviewScreen) return;

    // Initially show only a placeholder
    interviewScreen.innerHTML = `
      <div class="interview-placeholder">
        <div class="placeholder-content">
          <div class="placeholder-icon">🎯</div>
          <h2>Ready to Start Your Interview?</h2>
          <p>Configure your interview settings and click "Start Interview" to begin.</p>
          <div class="placeholder-tips">
            <h4>What to expect:</h4>
            <ul>
              <li>AI-generated questions based on your role and domain</li>
              <li>Real-time feedback and scoring</li>
              <li>Detailed performance analysis</li>
              <li>Personalized recommendations</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  renderInterviewInterface() {
    const interviewScreen = document.getElementById("interviewScreen");
    if (!interviewScreen) return;

    // Add active class to switch to grid layout
    interviewScreen.classList.add("interview-active");

    interviewScreen.innerHTML = `
            <!-- Left Panel - Interview Config -->
            <div class="modern-card config-panel">
                <div class="modern-card-header">
                    <div class="header-icon">📋</div>
                    <h3 class="modern-card-title">Interview Details</h3>
                </div>
                <div class="modern-card-content">
                    <div id="interviewConfig"></div>
                    <div class="progress-section">
                        <div class="progress-header">
                            <span class="progress-label">Progress</span>
                            <span id="progressText" class="progress-text">Question 0 of 0</span>
                        </div>
                        <div class="modern-progress-bar">
                            <div class="modern-progress-fill" id="progressFill"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Panel - Questions -->
            <div class="main-panel">
                <div class="modern-card question-card" id="questionCard">
                    <div class="modern-card-header">
                        <div class="question-header-content">
                            <div class="header-icon">❓</div>
                            <div class="question-info">
                                <div class="question-number" id="questionNumber">Question 1</div>
                                <div class="question-timer" id="questionTimer">00:00</div>
                            </div>
                        </div>
                    </div>
                    <div class="modern-card-content">
                        <div class="question-text" id="questionText">Loading question...</div>
                        <div class="answer-section">
                            <div class="answer-header">
                                <label class="modern-form-label" for="answerArea">Your Answer</label>
                                <div class="answer-stats">
                                    <span id="wordCount" class="stat-item">0 words</span>
                                    <span id="charCount" class="stat-item">0 characters</span>
                                </div>
                            </div>
                            <textarea 
                                class="modern-textarea" 
                                id="answerArea" 
                                placeholder="Type your answer here... Think out loud and explain your reasoning step by step."
                                rows="10"
                            ></textarea>
                        </div>
                        <div class="modern-action-buttons">
                            <button class="modern-btn secondary" id="skipBtn">
                                <span class="btn-icon">⏭️</span>
                                Skip Question
                            </button>
                            <button class="modern-btn secondary" id="retryBtn" disabled>
                                <span class="btn-icon">🔄</span>
                                Retry
                            </button>
                            <button class="modern-btn primary" id="submitBtn">
                                <span class="btn-icon">✅</span>
                                Submit Answer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Panel - Feedback -->
            <div class="modern-card feedback-panel" id="feedbackPanel">
                <div class="modern-card-header">
                    <div class="header-icon">💬</div>
                    <h3 class="modern-card-title">Feedback</h3>
                </div>
                <div class="modern-card-content">
                    <div id="feedbackContent">
                        <div class="modern-feedback-placeholder">
                            <div class="placeholder-icon">🤔</div>
                            <h4 class="placeholder-title">Ready for Feedback</h4>
                            <p class="placeholder-text">Submit your answer to receive detailed feedback and scoring.</p>
                            <div class="modern-tips">
                                <div class="tips-header">
                                    <div class="tips-icon">💡</div>
                                    <h4 class="tips-title">Tips for Success</h4>
                                </div>
                                <div class="tips-content">
                                    <div class="tip-item">
                                        <div class="tip-bullet"></div>
                                        <span>Think out loud and explain your reasoning</span>
                                    </div>
                                    <div class="tip-item">
                                        <div class="tip-bullet"></div>
                                        <span>Use specific examples from your experience</span>
                                    </div>
                                    <div class="tip-item">
                                        <div class="tip-bullet"></div>
                                        <span>Consider edge cases and potential issues</span>
                                    </div>
                                    <div class="tip-item">
                                        <div class="tip-bullet"></div>
                                        <span>Structure your answer logically</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  setupEventListeners() {
    // Event listeners will be set up when the interview interface is rendered
  }

  setupInterviewEventListeners() {
    const answerArea = document.getElementById("answerArea");
    const submitBtn = document.getElementById("submitBtn");
    const skipBtn = document.getElementById("skipBtn");
    const retryBtn = document.getElementById("retryBtn");

    if (answerArea) {
      answerArea.addEventListener("input", this.updateStats.bind(this));
      answerArea.addEventListener("input", this.enableRetry.bind(this));

      // Auto-save draft
      answerArea.addEventListener(
        "input",
        Utils.debounce(() => this.saveDraft(), 1000)
      );
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", this.handleSubmit.bind(this));
    }

    if (skipBtn) {
      skipBtn.addEventListener("click", this.handleSkip.bind(this));
    }

    if (retryBtn) {
      retryBtn.addEventListener("click", this.handleRetry.bind(this));
    }

    // Start question timer
    this.startTimer();
  }

  loadQuestion(questionData) {
    this.currentQuestion = questionData;
    this.isSubmitted = false;

    const questionCard = document.getElementById("questionCard");
    const questionNumber = document.getElementById("questionNumber");
    const questionText = document.getElementById("questionText");
    const answerArea = document.getElementById("answerArea");
    const submitBtn = document.getElementById("submitBtn");
    const retryBtn = document.getElementById("retryBtn");

    // Animate question change
    questionCard.classList.remove("active");

    setTimeout(() => {
      questionNumber.textContent = `Question ${questionData.index + 1}`;
      questionText.textContent = questionData.question;

      // Clear previous answer
      answerArea.value = "";
      answerArea.disabled = false;

      // Reset buttons
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Answer";
      retryBtn.disabled = true;

      // Load draft if exists
      this.loadDraft();

      // Update stats
      this.updateStats();

      // Restart timer
      this.resetTimer();

      questionCard.classList.add("active");
    }, 300);
  }

  updateProgress(progress) {
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");

    if (progressFill) {
      progressFill.style.width = `${progress.percentage}%`;
    }

    if (progressText) {
      progressText.textContent = `Question ${progress.current + 1} of ${progress.total}`;
    }
  }

  displayConfig(config) {
    const configDiv = document.getElementById("interviewConfig");
    if (!configDiv) return;

    configDiv.innerHTML = `
            <div class="config-details">
                <div class="config-item">
                    <span class="config-label">Role:</span>
                    <span class="config-value">${config.role}</span>
                </div>
                ${
                  config.domain
                    ? `
                <div class="config-item">
                    <span class="config-label">Domain:</span>
                    <span class="config-value">${config.domain}</span>
                </div>
                `
                    : ""
                }
                <div class="config-item">
                    <span class="config-label">Mode:</span>
                    <span class="config-value">${config.mode}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Difficulty:</span>
                    <span class="config-value">${config.difficulty}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Questions:</span>
                    <span class="config-value">${config.numQuestions}</span>
                </div>
            </div>
        `;
  }

  updateStats() {
    const answerArea = document.getElementById("answerArea");
    const wordCountEl = document.getElementById("wordCount");
    const charCountEl = document.getElementById("charCount");

    if (!answerArea) return;

    const text = answerArea.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    if (wordCountEl) wordCountEl.textContent = `${words} words`;
    if (charCountEl) charCountEl.textContent = `${chars} characters`;

    // Update submit button state
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn && !this.isSubmitted) {
      submitBtn.disabled = words === 0;
    }
  }

  enableRetry() {
    const retryBtn = document.getElementById("retryBtn");
    if (retryBtn && this.isSubmitted) {
      retryBtn.disabled = false;
    }
  }

  handleSubmit() {
    const answerArea = document.getElementById("answerArea");
    const submitBtn = document.getElementById("submitBtn");

    if (!answerArea || !answerArea.value.trim()) {
      alert("Please provide an answer before submitting.");
      return;
    }

    const answer = answerArea.value.trim();

    // Disable form
    answerArea.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    this.isSubmitted = true;

    // Clear draft
    this.clearDraft();

    // Stop timer
    this.stopTimer();

    // Submit answer
    this.callbacks.onSubmitAnswer(answer);
  }

  handleSkip() {
    const confirmation = confirm(
      "Are you sure you want to skip this question?\n\n" +
        "Skipped questions will receive a low score and count towards your final result."
    );

    if (confirmation) {
      this.isSubmitted = true;
      this.clearDraft();
      this.stopTimer();
      this.callbacks.onSkipQuestion();
    }
  }

  handleRetry() {
    this.clearAnswer();
    this.callbacks.onRetryQuestion();
  }

  clearAnswer() {
    const answerArea = document.getElementById("answerArea");
    const submitBtn = document.getElementById("submitBtn");
    const retryBtn = document.getElementById("retryBtn");

    if (answerArea) {
      answerArea.value = "";
      answerArea.disabled = false;
      answerArea.focus();
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submit Answer";
    }

    if (retryBtn) {
      retryBtn.disabled = true;
    }

    this.isSubmitted = false;
    this.updateStats();
    this.resetTimer();
  }

  // Timer functionality
  startTimer() {
    this.timerStart = Date.now();
    this.timerInterval = setInterval(this.updateTimer.bind(this), 1000);
  }

  updateTimer() {
    if (!this.timerStart) return;

    const elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    const timerEl = document.getElementById("questionTimer");
    if (timerEl) {
      timerEl.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  resetTimer() {
    this.stopTimer();
    this.startTimer();
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Draft functionality
  saveDraft() {
    const answerArea = document.getElementById("answerArea");
    if (!answerArea || !this.currentQuestion) return;

    const draftKey = `draft_${this.currentQuestion.index}`;
    Utils.saveToStorage(draftKey, answerArea.value);
  }

  loadDraft() {
    if (!this.currentQuestion) return;

    const draftKey = `draft_${this.currentQuestion.index}`;
    const draft = Utils.loadFromStorage(draftKey);

    if (draft) {
      const answerArea = document.getElementById("answerArea");
      if (answerArea) {
        answerArea.value = draft;
        this.updateStats();
      }
    }
  }

  clearDraft() {
    if (!this.currentQuestion) return;

    const draftKey = `draft_${this.currentQuestion.index}`;
    Utils.saveToStorage(draftKey, null);
  }
}
