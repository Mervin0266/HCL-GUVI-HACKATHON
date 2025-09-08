// components/summary-panel.js
/**
 * Summary panel component for final results
 */

class SummaryPanel {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.summary = null;
  }

  displaySummary(summary) {
    this.summary = summary;
    this.render(summary);
  }

  render(summary) {
    const summaryScreen = document.getElementById("summaryScreen");
    if (!summaryScreen) return;

    const {
      totalScore,
      analysis,
      recommendations,
      config,
      duration,
      questionCount,
      answeredCount,
      skippedCount,
    } = summary;
    const badgeClass = this.getPerformanceBadge(totalScore);
    const label = this.getPerformanceLabel(totalScore);

    summaryScreen.innerHTML = `
            <div class="card summary-card" style="padding: 32px;">
                <div style="display: grid; grid-template-columns: 360px 1fr; gap: 32px; align-items: start;">
                    <div class="score-column" style="background: var(--bg-secondary); color: var(--text-primary); border-radius: 16px; padding: 24px; height: fit-content; border: 1px solid var(--border);">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                            <h2 style="margin:0; font-size:22px; font-weight:600;">Interview Summary</h2>
                            <span class="performance-badge ${badgeClass}" style="padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${label}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:20px; margin:20px 0;">
                            ${this.renderScoreRing(totalScore)}
                            <div style="flex: 1;">
                                <div style="font-size:15px; color: var(--text-muted); margin-bottom:4px;">Overall Score</div>
                                <div style="font-size:14px; color: var(--text-secondary); margin-bottom:2px;">${config.role} • ${config.mode} • ${config.difficulty}</div>
                                <div style="font-size:13px; color: var(--text-muted);">${answeredCount}/${questionCount} answered • ${duration}m</div>
                    </div>
                </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:16px;">
                            ${this.renderMiniStat("Consistency", analysis.consistency)}
                            ${this.renderMiniStat("Trend", analysis.trend)}
                            ${this.renderMiniStat("Skipped", skippedCount)}
                            ${this.renderMiniStat("Questions", questionCount)}
                    </div>
                </div>

                    <div class="details-column" style="display:flex; flex-direction:column; gap:20px;">
                    ${this.renderAnalysis(analysis)}
                    ${this.renderRecommendations(recommendations)}
                        <div class="summary-actions" style="display:flex; gap:12px; justify-content:flex-end; margin-top:10px;">
                            <button class="btn btn-secondary" onclick="app.exportJSON()">📄 Export JSON</button>
                            <button class="btn btn-secondary" onclick="app.exportPDF()">📑 Export PDF</button>
                            <button class="btn btn-primary" onclick="app.startOver()">🔄 Start New Interview</button>
                </div>
                </div>
                </div>
            </div>
        `;
  }

  renderAnalysis(analysis) {
    return `
            <div class="analysis-section" style="background: var(--bg-secondary); border-radius:12px; padding:18px; border: 1px solid var(--border);">
                <div class="analysis-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:18px;">
                    <div class="analysis-card strengths-card" style="background: var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:16px;">
                        <h4 style="margin:0 0 8px 0; color: var(--text-primary);">✅ Strengths</h4>
                        <ul style="margin:0; padding-left:18px;">
                            ${
                              analysis.strengths &&
                              analysis.strengths.length > 0
                                ? analysis.strengths
                                    .map(
                                      (strength) =>
                                        `<li style="margin:6px 0; color: var(--text-secondary);">${strength}</li>`
                                    )
                                    .join("")
                                : '<li style="margin:6px 0; color: var(--text-muted); font-style:italic;">Focus on building confidence and attempting more questions</li>'
                            }
                        </ul>
                    </div>
                    <div class="analysis-card weaknesses-card" style="background: var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:16px;">
                        <h4 style="margin:0 0 8px 0; color: var(--text-primary);">⚠️ Areas for Improvement</h4>
                        <ul style="margin:0; padding-left:18px;">
                            ${analysis.weaknesses.map((weakness) => `<li style="color: var(--text-secondary);">${weakness}</li>`).join("")}
                        </ul>
                    </div>
                </div>
            </div>
        `;
  }

  renderRecommendations(recommendations) {
    return `
            <div class="recommendations-section" style="background: var(--bg-secondary); border-radius:12px; padding:18px; border: 1px solid var(--border);">
                <h3 style="margin:0 0 14px 0; color: var(--text-primary);">📋 Your Improvement Plan</h3>
                <div class="recommendations-grid" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:18px;">
                    <div class="recommendation-card immediate-card" style="background: var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:16px;">
                        <h4 style="margin:0 0 8px 0; color: var(--text-primary);">🎯 Immediate Actions</h4>
                        <ol style="margin:0; padding-left:18px;">
                            ${recommendations.immediate.map((action) => `<li style="color: var(--text-secondary);">${action}</li>`).join("")}
                        </ol>
                    </div>
                    <div class="recommendation-card short-term-card" style="background: var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:16px;">
                        <h4 style="margin:0 0 8px 0; color: var(--text-primary);">📈 Short-term Goals (1-3 months)</h4>
                        <ol style="margin:0; padding-left:18px;">
                            ${recommendations.shortTerm.map((goal) => `<li style="color: var(--text-secondary);">${goal}</li>`).join("")}
                        </ol>
                    </div>
                    <div class="recommendation-card long-term-card" style="background: var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:16px;">
                        <h4 style="margin:0 0 8px 0; color: var(--text-primary);">🚀 Long-term Development (3-12 months)</h4>
                        <ol style="margin:0; padding-left:18px;">
                            ${recommendations.longTerm.map((goal) => `<li style="color: var(--text-secondary);">${goal}</li>`).join("")}
                        </ol>
                    </div>
                    <div class="recommendation-card resources-card" style="background: var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:16px;">
                        <h4 style="margin:0 0 8px 0; color: var(--text-primary);">📚 Recommended Resources</h4>
                        <ul style="margin:0; padding-left:18px;">
                            ${recommendations.resources.map((resource) => `<li style="color: var(--text-secondary);">${resource}</li>`).join("")}
                        </ul>
                    </div>
                </div>
            </div>
        `;
  }

  renderScoreRing(score) {
    // Determine colors based on score
    let ringColor, textColor;
    if (score >= 7) {
      ringColor = "var(--success)"; // Green
      textColor = "var(--success)";
    } else if (score >= 5) {
      ringColor = "var(--accent)"; // Blue
      textColor = "var(--accent)";
    } else if (score >= 3) {
      ringColor = "var(--warning)"; // Orange
      textColor = "var(--warning)";
    } else {
      ringColor = "var(--error)"; // Red
      textColor = "var(--error)";
    }

    return `
      <div style="width:100px; height:100px; border-radius:50%; background:conic-gradient(${ringColor} ${score * 10}%, var(--border) 0); display:flex; align-items:center; justify-content:center; position: relative;">
        <div style="width:86px; height:86px; border-radius:50%; background: var(--bg-card); display:flex; align-items:center; justify-content:center; font-size:30px; font-weight:700; color:${textColor};">${score}</div>
      </div>
    `;
  }

  renderMiniStat(label, value) {
    // Handle special cases for trend and consistency
    let displayValue = value;
    let valueColor = "#e2e8f0";

    if (label === "Trend") {
      switch (value) {
        case "all_skipped":
          displayValue = "All Skipped";
          valueColor = "#ef4444";
          break;
        case "incomplete":
          displayValue = "Incomplete";
          valueColor = "#f59e0b";
          break;
        case "insufficient_data":
          displayValue = "No Data";
          valueColor = "#6b7280";
          break;
        case "improving":
          displayValue = "Improving";
          valueColor = "#10b981";
          break;
        case "declining":
          displayValue = "Declining";
          valueColor = "#ef4444";
          break;
        case "consistent":
          displayValue = "Consistent";
          valueColor = "#3b82f6";
          break;
        default:
          displayValue = value;
      }
    }

    if (label === "Consistency") {
      switch (value) {
        case "no_attempts":
          displayValue = "No Attempts";
          valueColor = "#ef4444";
          break;
        case "mixed_attempts":
          displayValue = "Mixed";
          valueColor = "#f59e0b";
          break;
        case "unknown":
          displayValue = "Unknown";
          valueColor = "#6b7280";
          break;
        case "high":
          displayValue = "High";
          valueColor = "#10b981";
          break;
        case "moderate":
          displayValue = "Moderate";
          valueColor = "#3b82f6";
          break;
        case "low":
          displayValue = "Low";
          valueColor = "#f59e0b";
          break;
        default:
          displayValue = value;
      }
    }

    return `
            <div style="background: var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:22px; font-weight:700; color:${valueColor};">${displayValue}</div>
                <div style="font-size:12px; color: var(--text-muted);">${label}</div>
            </div>
        `;
  }

  getPerformanceBadge(score) {
    if (score >= 8.5) return "excellent";
    if (score >= 7) return "good";
    if (score >= 5.5) return "average";
    return "needs-improvement";
  }

  getPerformanceLabel(score) {
    if (score >= 8.5) return "Excellent";
    if (score >= 7) return "Good";
    if (score >= 5.5) return "Average";
    return "Needs Improvement";
  }
}
