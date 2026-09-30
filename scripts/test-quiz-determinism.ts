// scripts/test-quiz-determinism.ts — run with tsx.
// Asserts: same (date, userId, subjects) => identical 10-question quiz;
// different date => different quiz; different user => different quiz.
import { buildQuiz, type QuizTopicInput } from "../lib/quiz/generator";

const subjects = [
  { slug: "physics", name: "Physics" },
  { slug: "chemistry", name: "Chemistry" },
  { slug: "mathematics", name: "Mathematics" },
];

function topics(subjectSlug: string, subjectName: string, n: number): QuizTopicInput[] {
  return Array.from({ length: n }, (_, i) => ({
    subjectSlug,
    subjectName,
    topicSlug: `topic-${i + 1}`,
    topicName: `${subjectName} Topic ${i + 1}`,
  }));
}

const topicsBySubject: Record<string, QuizTopicInput[]> = {
  physics: topics("physics", "Physics", 8),
  chemistry: topics("chemistry", "Chemistry", 8),
};

const base = {
  userId: "42",
  dateStr: "2026-09-29",
  subjectSlugs: ["physics", "chemistry"],
  allSubjects: subjects,
  topicsBySubject,
  contentQuizzes: {},
};

const q1 = buildQuiz(base);
const q2 = buildQuiz(base);
const qDiffDate = buildQuiz({ ...base, dateStr: "2026-09-30" });
const qDiffUser = buildQuiz({ ...base, userId: "43" });
const qSingle = buildQuiz({ ...base, subjectSlugs: ["mathematics"], topicsBySubject: { mathematics: topics("mathematics", "Mathematics", 8) } });

const validOptions = q1.every((q) => q.options.length === 4 && new Set(q.options).size === 4 && q.correctIndex >= 0 && q.correctIndex < 4);
const same = JSON.stringify(q1) === JSON.stringify(q2);
const diffDate = JSON.stringify(q1) !== JSON.stringify(qDiffDate);
const diffUser = JSON.stringify(q1) !== JSON.stringify(qDiffUser);

console.log("questions built:", q1.length);
console.log("all options valid (4 unique, correctIndex in range):", validOptions);
console.log("both subjects represented:", new Set(q1.map((q) => q.subjectSlug)).size === 2);
console.log("single-subject quiz builds:", qSingle.length === 10 && new Set(qSingle.map((q) => q.subjectSlug)).size === 1);
console.log("sample Q:", q1[0].question, "| source:", q1[0].source);
console.log("RESULT: same-seed identical =", same, "| different-date differs =", diffDate, "| different-user differs =", diffUser);

if (!(same && diffDate && diffUser && q1.length === 10 && validOptions)) {
  console.error("DETERMINISM TEST FAILED");
  process.exit(1);
}
console.log("DETERMINISM TEST PASSED");
