'use strict';

/**
 * Server-side scoring. Nothing in this module is ever sent to the exam client
 * or the receipt; its output exists only inside the immutable submission
 * snapshot used to render the two PDFs.
 */

const DEFAULT_GRADE_SCALE = [
  { grade: 'A', min: 70 },
  { grade: 'B', min: 60 },
  { grade: 'C', min: 50 },
  { grade: 'D', min: 45 },
  { grade: 'E', min: 40 },
  { grade: 'F', min: 0 },
];

const PASS_MARK = 40;

function gradeFor(percentage, scale = DEFAULT_GRADE_SCALE) {
  for (const band of scale) {
    if (percentage >= band.min) return band.grade;
  }
  return scale[scale.length - 1].grade;
}

function round1(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

/**
 * @param {object} attempt  private attempt record (paper + displayAnswers)
 * @param {object} bank     loaded bank
 * @param {object} [scale]  grade bands, highest first
 */
function scoreAttempt(attempt, bank, scale = DEFAULT_GRADE_SCALE) {
  const total = attempt.paper.length;
  const byTopic = new Map();
  const questions = [];
  let score = 0;

  attempt.paper.forEach((itemId, index) => {
    const item = bank.byId.get(itemId);
    if (!item) throw new Error(`paper item ${itemId} is not in the bank`);
    const n = index + 1;
    const chosen = Object.prototype.hasOwnProperty.call(attempt.answers, String(n))
      ? attempt.answers[String(n)]
      : null;
    const correctIndex = attempt.displayAnswers[index];
    const correct = chosen !== null && chosen === correctIndex;
    if (correct) score += 1;

    let topic = byTopic.get(item.topic);
    if (!topic) {
      topic = {
        topic: item.topic,
        label: item.topicLabel,
        questions: 0,
        correct: 0,
      };
      byTopic.set(item.topic, topic);
    }
    topic.questions += 1;
    if (correct) topic.correct += 1;

    questions.push({
      n,
      ref: item.id,
      topic: item.topic,
      topicLabel: item.topicLabel,
      chosen,
      correctIndex,
      correct,
      unanswered: chosen === null,
    });
  });

  const percentage = total ? round1((score / total) * 100) : 0;
  const topics = Array.from(byTopic.values()).map((topic) => ({
    ...topic,
    percentage: topic.questions ? round1((topic.correct / topic.questions) * 100) : 0,
  }));

  return {
    score,
    total,
    percentage,
    grade: gradeFor(percentage, scale),
    outcome: percentage >= PASS_MARK ? 'Pass' : 'Fail',
    answered: total - questions.filter((q) => q.unanswered).length,
    questions,
    topics,
    scale,
  };
}

module.exports = { DEFAULT_GRADE_SCALE, PASS_MARK, gradeFor, scoreAttempt, round1 };
