// assets/js/scoring-system.js
/**
 * Intelligent scoring and evaluation system
 */

const ScoringSystem = {
  /**
   * Technical interview rubric (out of 10)
   */
  technicalRubric: {
    correctness: {
      max: 4,
      weight: 0.4,
      description: "Technical accuracy and correctness of solution",
    },
    efficiency: {
      max: 2,
      weight: 0.2,
      description: "Time/space complexity and optimization",
    },
    completeness: {
      max: 2,
      weight: 0.2,
      description: "Coverage of all requirements and edge cases",
    },
    clarity: {
      max: 2,
      weight: 0.2,
      description: "Code readability and explanation quality",
    },
  },

  /**
   * Behavioral interview rubric (STAR method, out of 10)
   */
  behavioralRubric: {
    situation: {
      max: 2,
      weight: 0.2,
      description: "Context and background setup",
    },
    actions: {
      max: 4,
      weight: 0.4,
      description: "Specific actions taken and decision-making",
    },
    results: {
      max: 2,
      weight: 0.2,
      description: "Outcomes and measurable impact",
    },
    reflection: {
      max: 2,
      weight: 0.2,
      description: "Lessons learned and future improvements",
    },
  },

  /**
   * Evaluate an answer
   */
  evaluateAnswer(question, answer, config) {
    const { mode, difficulty, role } = config;
    const rubric =
      mode === "Technical" ? this.technicalRubric : this.behavioralRubric;

    const analysis = this.analyzeAnswer(answer, mode);
    const scores = this.calculateScores(analysis, rubric, difficulty);
    const feedback = this.generateFeedback(scores, analysis, mode, difficulty);

    return {
      question_id: Utils.generateId(),
      question_text: question,
      candidate_answer: answer,
      score: this.calculateTotalScore(scores),
      breakdown: scores,
      feedback: feedback.summary,
      improvements: feedback.improvements,
      resources: feedback.resources,
      analysis: analysis,
    };
  },

  /**
   * Analyze answer content
   */
  analyzeAnswer(answer, mode) {
    const wordCount = answer.trim().split(/\s+/).length;
    const charCount = answer.length;

    return {
      wordCount,
      charCount,
      hasStructure: this.hasStructure(answer),
      hasExamples: this.hasExamples(answer),
      hasTechnicalTerms: this.hasTechnicalTerms(answer),
      usesSTARMethod:
        mode === "Behavioral" ? this.usesSTARMethod(answer) : false,
      hasQuantification: this.hasQuantification(answer),
      codeQuality:
        mode === "Technical" ? this.analyzeCodeQuality(answer) : null,
      complexity: this.analyzeComplexity(answer),
      sentiment: this.analyzeSentiment(answer),
    };
  },

  /**
   * Check if answer has good structure
   */
  hasStructure(answer) {
    const paragraphs = answer.split("\n\n").length;
    const bullets = (answer.match(/[•\-\*]\s/g) || []).length;
    const numbering = (answer.match(/\d+\.\s/g) || []).length;

    return paragraphs > 1 || bullets > 1 || numbering > 1;
  },

  /**
   * Check if answer includes examples
   */
  hasExamples(answer) {
    const patterns =
      /\b(example|for instance|such as|like|consider|imagine|suppose)\b/gi;
    return patterns.test(answer);
  },

  /**
   * Check for technical terminology
   */
  hasTechnicalTerms(answer) {
    const technicalPatterns =
      /\b(algorithm|complexity|performance|scale|optimize|architecture|design|implement|framework|library|database|api|system|server|client|cache|queue|hash|tree|graph|stack|heap)\b/gi;
    return (answer.match(technicalPatterns) || []).length > 2;
  },

  /**
   * Check if answer follows STAR method
   */
  usesSTARMethod(answer) {
    const situation =
      /\b(situation|context|background|scenario|project|challenge)\b/gi.test(
        answer
      );
    const task = /\b(task|goal|objective|responsibility|role|needed)\b/gi.test(
      answer
    );
    const action =
      /\b(action|did|approach|solution|implemented|decided|strategy)\b/gi.test(
        answer
      );
    const result =
      /\b(result|outcome|impact|achieved|improved|success|learned)\b/gi.test(
        answer
      );

    return { situation, task, action, result };
  },

  /**
   * Check for quantification
   */
  hasQuantification(answer) {
    const patterns =
      /\b(\d+%|\$\d+|reduced|increased|improved|saved|\d+x|times|faster|slower|more|less)\b/gi;
    return patterns.test(answer);
  },

  /**
   * Analyze code quality (basic)
   */
  analyzeCodeQuality(answer) {
    const hasCode =
      /```|`[^`]+`/g.test(answer) ||
      /function|class|def |var |let |const /.test(answer);

    if (!hasCode) return null;

    return {
      hasCode,
      hasComments: /\/\/|\/\*|\#/.test(answer),
      hasVariableNames: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/.test(answer),
      hasErrorHandling: /try|catch|except|error|throw/.test(answer),
    };
  },

  /**
   * Analyze answer complexity
   */
  analyzeComplexity(answer) {
    const sentences = answer.split(/[.!?]+/).length;
    const avgWordsPerSentence = answer.split(/\s+/).length / sentences;

    return {
      sentences,
      avgWordsPerSentence,
      complexity:
        avgWordsPerSentence > 20
          ? "high"
          : avgWordsPerSentence > 12
            ? "medium"
            : "low",
    };
  },

  /**
   * Basic sentiment analysis
   */
  analyzeSentiment(answer) {
    const positive = (
      answer.match(
        /\b(success|achieved|improved|good|great|excellent|effective|efficient)\b/gi
      ) || []
    ).length;
    const negative = (
      answer.match(
        /\b(failed|problem|difficult|challenge|issue|mistake|wrong)\b/gi
      ) || []
    ).length;

    return {
      positive,
      negative,
      overall:
        positive > negative
          ? "positive"
          : negative > positive
            ? "negative"
            : "neutral",
    };
  },

  /**
   * Calculate scores based on analysis
   */
  calculateScores(analysis, rubric, difficulty) {
    const difficultyMultiplier = { Easy: 0.8, Medium: 1.0, Hard: 1.2 };
    const multiplier = difficultyMultiplier[difficulty] || 1.0;

    const scores = {};

    Object.keys(rubric).forEach((criterion) => {
      let score = 0;
      const maxScore = rubric[criterion].max;

      switch (criterion) {
        case "correctness":
          score = this.scoreCorrectness(analysis, maxScore);
          break;
        case "efficiency":
          score = this.scoreEfficiency(analysis, maxScore);
          break;
        case "completeness":
          score = this.scoreCompleteness(analysis, maxScore);
          break;
        case "clarity":
          score = this.scoreClarity(analysis, maxScore);
          break;
        case "situation":
          score = this.scoreSituation(analysis, maxScore);
          break;
        case "actions":
          score = this.scoreActions(analysis, maxScore);
          break;
        case "results":
          score = this.scoreResults(analysis, maxScore);
          break;
        case "reflection":
          score = this.scoreReflection(analysis, maxScore);
          break;
      }

      scores[criterion] = Math.min(maxScore, score * multiplier);
    });

    return scores;
  },

  /**
   * Score correctness
   */
  scoreCorrectness(analysis, maxScore) {
    let score = 1; // Base score

    if (analysis.wordCount > 50) score += 1;
    if (analysis.hasTechnicalTerms) score += 1;
    if (analysis.hasExamples) score += 0.5;
    if (analysis.codeQuality && analysis.codeQuality.hasCode) score += 0.5;

    return Math.min(maxScore, score);
  },

  /**
   * Score efficiency
   */
  scoreEfficiency(analysis, maxScore) {
    let score = 0.5; // Base score

    if (analysis.hasStructure) score += 0.5;
    if (analysis.wordCount > 30 && analysis.wordCount < 300) score += 0.5;
    if (analysis.complexity.complexity === "medium") score += 0.5;

    return Math.min(maxScore, score);
  },

  /**
   * Score completeness
   */
  scoreCompleteness(analysis, maxScore) {
    let score = 0.5;

    if (analysis.wordCount > 100) score += 0.5;
    if (analysis.hasExamples) score += 0.5;
    if (analysis.hasTechnicalTerms) score += 0.5;

    return Math.min(maxScore, score);
  },

  /**
   * Score clarity
   */
  scoreClarity(analysis, maxScore) {
    let score = 0.5;

    if (analysis.hasStructure) score += 0.5;
    if (analysis.complexity.avgWordsPerSentence < 25) score += 0.5;
    if (analysis.wordCount > 30) score += 0.5;

    return Math.min(maxScore, score);
  },

  /**
   * Score situation (STAR)
   */
  scoreSituation(analysis, maxScore) {
    const star = analysis.usesSTARMethod;
    let score = 0.5;

    if (star.situation) score += 1;
    if (star.task) score += 0.5;

    return Math.min(maxScore, score);
  },

  /**
   * Score actions (STAR)
   */
  scoreActions(analysis, maxScore) {
    const star = analysis.usesSTARMethod;
    let score = 1;

    if (star.action) score += 1.5;
    if (analysis.wordCount > 80) score += 1;
    if (analysis.hasExamples) score += 0.5;

    return Math.min(maxScore, score);
  },

  /**
   * Score results (STAR)
   */
  scoreResults(analysis, maxScore) {
    const star = analysis.usesSTARMethod;
    let score = 0.5;

    if (star.result) score += 1;
    if (analysis.hasQuantification) score += 0.5;

    return Math.min(maxScore, score);
  },

  /**
   * Score reflection (STAR)
   */
  scoreReflection(analysis, maxScore) {
    let score = 0.5;

    if (
      /\b(learned|takeaway|reflection|insight|next time)\b/gi.test(
        analysis.answer || ""
      )
    ) {
      score += 1;
    }
    if (analysis.sentiment.overall === "positive") score += 0.5;

    return Math.min(maxScore, score);
  },

  /**
   * Calculate total score
   */
  calculateTotalScore(scores) {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round(total * 10) / 10;
  },

  /**
   * Generate comprehensive feedback
   */
  generateFeedback(scores, analysis, mode, difficulty) {
    const totalScore = this.calculateTotalScore(scores);

    return {
      summary: this.generateSummaryFeedback(totalScore, mode, difficulty),
      improvements: this.generateImprovements(scores, analysis, mode),
      resources: this.generateResources(mode, difficulty, totalScore),
    };
  },

  /**
   * Generate summary feedback
   */
  generateSummaryFeedback(score, mode, difficulty) {
    const level =
      score >= 8.5
        ? "excellent"
        : score >= 7
          ? "good"
          : score >= 5.5
            ? "decent"
            : "needs improvement";

    const feedbackTemplates = {
      excellent: [
        "Outstanding response! Your answer demonstrates exceptional understanding and communication skills.",
        "Excellent work! You've shown deep knowledge and structured your response very effectively.",
        "Impressive answer! Your technical depth and clarity are exactly what interviewers look for.",
      ],
      good: [
        "Good solid answer! You demonstrate strong understanding with room for minor improvements.",
        "Well-structured response showing good competence in the subject matter.",
        "Nice work! Your answer shows good technical knowledge and communication skills.",
      ],
      decent: [
        "Decent response that addresses the key points. Consider adding more depth and examples.",
        "Your answer shows understanding but could benefit from more structure and detail.",
        "Good foundation, but expanding on your points would strengthen your response.",
      ],
      "needs improvement": [
        "Your answer needs more development. Focus on providing comprehensive details and clear structure.",
        "Consider expanding your response with more specific examples and deeper analysis.",
        "Work on structuring your answer more clearly and providing additional supporting details.",
      ],
    };

    const templates = feedbackTemplates[level];
    return templates[Math.floor(Math.random() * templates.length)];
  },

  /**
   * Generate improvement suggestions
   */
  generateImprovements(scores, analysis, mode) {
    const improvements = [];

    // General improvements based on analysis
    if (analysis.wordCount < 50) {
      improvements.push(
        "Provide more detailed explanations and elaborate on your key points"
      );
    }

    if (!analysis.hasStructure) {
      improvements.push(
        "Structure your response with clear paragraphs or bullet points for better readability"
      );
    }

    if (!analysis.hasExamples) {
      improvements.push(
        "Include specific examples to illustrate your points and make them more concrete"
      );
    }

    // Mode-specific improvements
    if (mode === "Technical") {
      if (!analysis.hasTechnicalTerms) {
        improvements.push(
          "Use more technical terminology to demonstrate your expertise"
        );
      }

      if (scores.efficiency < 1.5) {
        improvements.push(
          "Discuss time and space complexity to show algorithmic thinking"
        );
      }

      if (analysis.codeQuality && !analysis.codeQuality.hasComments) {
        improvements.push(
          "Add comments to your code examples for better clarity"
        );
      }
    } else {
      const star = analysis.usesSTARMethod;
      if (!star.situation) {
        improvements.push(
          "Start with a clear description of the situation or context"
        );
      }

      if (!star.action) {
        improvements.push(
          "Focus more on the specific actions you took to address the situation"
        );
      }

      if (!star.result) {
        improvements.push("Include the outcomes and results of your actions");
      }

      if (!analysis.hasQuantification) {
        improvements.push(
          "Quantify your impact with specific metrics and numbers where possible"
        );
      }
    }

    return improvements.slice(0, 3); // Limit to top 3
  },

  /**
   * Generate resource recommendations
   */
  generateResources(mode, difficulty, score) {
    const baseResources = {
      Technical: [
        "LeetCode for algorithm practice",
        "System Design Interview by Alex Xu",
        "Cracking the Coding Interview by Gayle McDowell",
      ],
      Behavioral: [
        "The STAR Method for Behavioral Interviews",
        "Behavioral Interview Questions Database",
        "Leadership and Communication Skills Development",
      ],
    };

    const resources = [...baseResources[mode]];

    // Add difficulty-specific resources
    if (difficulty === "Hard" || score < 6) {
      if (mode === "Technical") {
        resources.push(
          "Design Patterns: Elements of Reusable Object-Oriented Software"
        );
        resources.push("High-Performance Computing resources");
      } else {
        resources.push("Executive Leadership Development Programs");
        resources.push("Conflict Resolution and Team Management");
      }
    }

    // Add score-specific resources
    if (score < 5) {
      resources.unshift("Fundamental concepts review materials");
      resources.push("Practice interview platforms (Pramp, InterviewBuddy)");
    }

    return resources.slice(0, 4); // Limit to 4 resources
  },
};
