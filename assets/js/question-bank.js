// assets/js/question-bank.js
/**
 * Question bank and generation system
 */

const QuestionBank = {
  /**
   * Generate questions via LLM
   */
  async generateQuestions(config) {
    // Always use LLM questions
    try {
      const questions = await LLMService.generateQuestions(config);
      if (Array.isArray(questions) && questions.length > 0) {
        return Utils.shuffleArray(questions).slice(0, config.numQuestions);
      }
      throw new Error("No questions returned");
    } catch (e) {
      const message = e && e.message ? e.message : "Unknown error";
      throw new Error(`Failed to generate questions from LLM: ${message}`);
    }
  },

  /**
   * Get question difficulty score
   */
  getDifficultyScore(difficulty) {
    const scores = { Easy: 1, Medium: 2, Hard: 3 };
    return scores[difficulty] || 1;
  },

  /**
   * Get role-specific evaluation criteria
   */
  getRoleEvaluationCriteria(role) {
    const defaults = ["Communication", "Problem-solving", "Depth of knowledge"];
    return defaults;
  },
};
