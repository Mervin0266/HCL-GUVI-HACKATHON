// components/feedback-panel.js
/**
 * Feedback panel component for displaying evaluation results
 */

class FeedbackPanel {
  constructor() {
    this.currentFeedback = null;
  }

  showFeedback(evaluation) {
    this.currentFeedback = evaluation;

    const feedbackPanel = document.getElementById("feedbackPanel");
    const feedbackContent = document.getElementById("feedbackContent");

    if (!feedbackContent) return;

    // Animate feedback appearance
    feedbackPanel.classList.remove("active");

    setTimeout(() => {
      feedbackContent.innerHTML = this.renderFeedback(evaluation);
      feedbackPanel.classList.add("active", "animate-fade-in-left");
    }, 300);
  }

  renderFeedback(evaluation) {
    const { score, breakdown, feedback, improvements, resources } = evaluation;

    // Generate breakdown HTML
    const breakdownHTML = this.renderBreakdown(breakdown);

    return `
            <div class="feedback-content">
                <div class="feedback-header">
                    <div class="score-display">
                        <div class="score-circle" style="background: conic-gradient(var(--accent) ${score * 10}%, var(--border) 0);">
                            <div class="score-inner">
                                ${score}
                            </div>
                        </div>
                        <div class="score-info">
                            <div class="score-label">Overall Score</div>
                            <div class="score-subtitle">Out of 10 points</div>
                            <div class="score-grade">${this.getScoreGrade(score)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="feedback-main">
                    <div class="feedback-card primary">
                        <div class="card-icon">💬</div>
                        <h4 class="card-title">Detailed Feedback</h4>
                        <p class="feedback-message">${feedback}</p>
                    </div>
                    
                    <div class="feedback-card">
                        <div class="card-icon">📊</div>
                        <h4 class="card-title">Score Breakdown</h4>
                        <div class="breakdown-list">
                            ${breakdownHTML}
                        </div>
                    </div>
                </div>
                
                <div class="feedback-suggestions">
                    <div class="suggestion-card">
                        <div class="suggestion-header">
                            <div class="suggestion-icon">💡</div>
                            <h4 class="suggestion-title">Improvements</h4>
                        </div>
                        <div class="suggestion-content">
                            ${improvements
                              .map(
                                (imp) => `
                                <div class="suggestion-item">
                                    <div class="suggestion-bullet"></div>
                                    <span>${imp}</span>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                    
                    <div class="suggestion-card">
                        <div class="suggestion-header">
                            <div class="suggestion-icon">📚</div>
                            <h4 class="suggestion-title">Resources</h4>
                        </div>
                        <div class="suggestion-content">
                            ${resources
                              .map(
                                (res) => `
                                <div class="suggestion-item">
                                    <div class="suggestion-bullet"></div>
                                    <span>${res}</span>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  renderBreakdown(breakdown) {
    return Object.entries(breakdown)
      .map(([criterion, score]) => {
        const maxScore = this.getMaxScore(criterion);
        const percentage = (score / maxScore) * 100;
        const description = this.getCriterionDescription(criterion);

        return `
                <div class="breakdown-item">
                    <div class="breakdown-header">
                        <div class="breakdown-label">
                            ${criterion.charAt(0).toUpperCase() + criterion.slice(1)}
                        </div>
                        <div class="breakdown-score">
                            ${score}/${maxScore}
                        </div>
                    </div>
                    <div class="breakdown-description">
                        ${description}
                    </div>
                    <div class="breakdown-bar">
                        <div class="breakdown-fill" style="width: ${percentage}%;"></div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  getMaxScore(criterion) {
    const maxScores = {
      correctness: 4,
      efficiency: 2,
      completeness: 2,
      clarity: 2,
      situation: 2,
      actions: 4,
      results: 2,
      reflection: 2,
    };
    return maxScores[criterion] || 2;
  }

  getCriterionDescription(criterion) {
    const descriptions = {
      correctness: "Technical accuracy and correctness of solution",
      efficiency: "Time/space complexity and optimization",
      completeness: "Coverage of all requirements and edge cases",
      clarity: "Code readability and explanation quality",
      situation: "Context and background setup",
      actions: "Specific actions taken and decision-making",
      results: "Outcomes and measurable impact",
      reflection: "Lessons learned and future improvements",
    };
    return descriptions[criterion] || "Evaluation criterion";
  }

  getScoreGrade(score) {
    if (score >= 9) return "Excellent";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    if (score >= 6) return "Satisfactory";
    if (score >= 5) return "Needs Improvement";
    return "Poor";
  }

  clearFeedback() {
    const feedbackContent = document.getElementById("feedbackContent");
    const feedbackPanel = document.getElementById("feedbackPanel");

    if (feedbackContent) {
      feedbackContent.innerHTML = `
                <div class="feedback-placeholder">
                    <div class="placeholder-icon">🤔</div>
                    <p>Submit your answer to receive detailed feedback and scoring.</p>
                </div>
            `;
    }

    if (feedbackPanel) {
      feedbackPanel.classList.remove("active");
    }

    this.currentFeedback = null;
  }
}
