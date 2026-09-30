// scripts/test-quiz-realdb.ts — build a quiz from REAL db topics via DeterministicProvider.
import { prisma } from "../lib/db";
import { getSubjects } from "../lib/taxonomy";
import { matchSim } from "../lib/simulations/registry";
import { getTopicContent } from "../lib/topic-content";
import { DeterministicProvider } from "../lib/quiz/provider";
import type { QuizTopicInput, ContentQuizItem } from "../lib/quiz/generator";

async function main() {
  const subjects = getSubjects().map((s) => ({ slug: s.slug, name: s.name }));
  const prefs = ["physics", "chemistry"];
  const topics = await prisma.topic.findMany({
    where: {
      subcategory: { category: { subject: { slug: { in: prefs } } } },
    },
    select: {
      slug: true,
      name: true,
      subcategory: {
        select: {
          category: { select: { subject: { select: { slug: true } } } },
        },
      },
    },
  });
  console.log("topics for physics+chemistry:", topics.length);
  const nameBySlug = new Map(subjects.map((s) => [s.slug, s.name]));
  const topicsBySubject: Record<string, QuizTopicInput[]> = {
    physics: [],
    chemistry: [],
  };
  const contentQuizzes: Record<string, ContentQuizItem[]> = {};
  let simTopics = 0;
  for (const t of topics) {
    const ss = t.subcategory.category.subject.slug;
    topicsBySubject[ss].push({
      subjectSlug: ss,
      subjectName: nameBySlug.get(ss) ?? ss,
      topicSlug: t.slug,
      topicName: t.name,
    });
    const sim = matchSim(t.name);
    if (sim) {
      const c = await getTopicContent(sim);
      if (c.quiz.length > 0) {
        contentQuizzes[t.slug] = c.quiz;
        simTopics++;
      }
    }
  }
  console.log("sim-backed topics with quiz data:", simTopics);
  const provider = new DeterministicProvider();
  const input = {
    subjectSlugs: prefs,
    allSubjects: subjects,
    topicsBySubject,
    contentQuizzes,
  };
  const q1 = await provider.generateQuestions({ ...input, dateStr: "2026-09-29", userId: "2" });
  const q2 = await provider.generateQuestions({ ...input, dateStr: "2026-09-29", userId: "2" });
  const q3 = await provider.generateQuestions({ ...input, dateStr: "2026-09-30", userId: "2" });
  const src = (q: typeof q1) =>
    q.reduce<Record<string, number>>((m, x) => {
      m[x.source] = (m[x.source] ?? 0) + 1;
      return m;
    }, {});
  console.log("quiz len:", q1.length, "| sources:", JSON.stringify(src(q1)));
  console.log("same-seed identical:", JSON.stringify(q1) === JSON.stringify(q2));
  console.log("diff-date differs:", JSON.stringify(q1) !== JSON.stringify(q3));
  console.log(
    "valid options:",
    q1.every(
      (q) =>
        q.options.length === 4 &&
        new Set(q.options).size === 4 &&
        q.correctIndex >= 0 &&
        q.correctIndex < 4
    )
  );
  console.log("Q1:", q1[0].source, "-", q1[0].question.slice(0, 90));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
