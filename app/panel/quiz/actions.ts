"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSubjects } from "@/lib/taxonomy";
import { matchSim } from "@/lib/simulations/registry";
import { getTopicContent } from "@/lib/topic-content";
import {
  buildQuiz,
  type GeneratedQuestion,
  type QuizGenerationInput,
  type QuizTopicInput,
} from "@/lib/quiz/generator";
import { todayStr } from "@/lib/quiz/date";
import { DeterministicProvider } from "@/lib/quiz/provider";

const provider = new DeterministicProvider();

async function requireUserId(): Promise<number> {
  const session = await auth();
  const id = session?.user ? Number(session.user.id) : NaN;
  if (!id) throw new Error("Not signed in.");
  return id;
}

function parsePrefs(raw: string | null, fallback: string[]): string[] {
  if (!raw) return fallback;
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      const valid = new Set(fallback);
      const cleaned = arr.filter((s) => typeof s === "string" && valid.has(s));
      return cleaned.length > 0 ? cleaned : fallback;
    }
  } catch {
    /* fall through */
  }
  return fallback;
}

export async function getQuizPrefs(): Promise<string[]> {
  const userId = await requireUserId();
  const all = getSubjects().map((s) => s.slug);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { quizSubjects: true },
  });
  return parsePrefs(user?.quizSubjects ?? null, all);
}

export async function saveQuizPrefs(subjectSlugs: string[]): Promise<void> {
  const userId = await requireUserId();
  const all = getSubjects().map((s) => s.slug);
  const valid = new Set(all);
  const cleaned = [...new Set(subjectSlugs)].filter((s) => valid.has(s));
  if (cleaned.length === 0) throw new Error("Select at least one subject.");
  await prisma.user.update({
    where: { id: userId },
    data: { quizSubjects: JSON.stringify(cleaned) },
  });
  revalidatePath("/panel/quiz");
}

async function buildTodayInput(
  userId: number,
  subjectSlugs: string[]
): Promise<QuizGenerationInput> {
  const subjects = getSubjects().map((s) => ({ slug: s.slug, name: s.name }));
  const nameBySlug = new Map(subjects.map((s) => [s.slug, s.name]));

  // Topics for the selected subjects (DB mirrors taxonomy).
  const topics = await prisma.topic.findMany({
    where: {
      subcategory: { category: { subject: { slug: { in: subjectSlugs } } } },
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

  const topicsBySubject: Record<string, QuizTopicInput[]> = {};
  for (const s of subjectSlugs) topicsBySubject[s] = [];
  const contentQuizzes: Record<string, { q: string; a: string }[]> = {};

  for (const t of topics) {
    const subjectSlug = t.subcategory.category.subject.slug;
    const rec: QuizTopicInput = {
      subjectSlug,
      subjectName: nameBySlug.get(subjectSlug) ?? subjectSlug,
      topicSlug: t.slug,
      topicName: t.name,
    };
    topicsBySubject[subjectSlug].push(rec);
    // Real written quiz data only for sim-backed topics (matchSim non-null).
    const simKey = matchSim(t.name);
    if (simKey) {
      const content = await getTopicContent(simKey);
      if (content.quiz.length > 0) contentQuizzes[t.slug] = content.quiz;
    }
  }

  return {
    dateStr: todayStr(),
    userId: String(userId),
    subjectSlugs,
    allSubjects: subjects,
    topicsBySubject,
    contentQuizzes,
  };
}

/** Build (or rebuild — it is deterministic) today's quiz for the user. */
export async function getDailyQuiz(): Promise<GeneratedQuestion[]> {
  const userId = await requireUserId();
  const prefs = await getQuizPrefs();
  const input = await buildTodayInput(userId, prefs);
  return provider.generateQuestions(input);
}

export interface QuizAnswer {
  id: string;
  selectedIndex: number;
}

export interface QuizReviewItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number;
  correct: boolean;
  source: "content" | "template";
}

export interface QuizResult {
  score: number;
  total: number;
  review: QuizReviewItem[];
}

/** Grade the submitted answers against the deterministic quiz, save the attempt. */
export async function submitQuiz(answers: QuizAnswer[]): Promise<QuizResult> {
  const userId = await requireUserId();
  const prefs = await getQuizPrefs();
  const questions = await buildQuiz(await buildTodayInput(userId, prefs));
  const byId = new Map(questions.map((q) => [q.id, q]));

  const review: QuizReviewItem[] = answers
    .map((a) => {
      const q = byId.get(a.id);
      if (!q) return null;
      const correct = a.selectedIndex === q.correctIndex;
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        selectedIndex: a.selectedIndex,
        correct,
        source: q.source,
      };
    })
    .filter((r): r is QuizReviewItem => r !== null);

  const score = review.filter((r) => r.correct).length;

  await prisma.quizAttempt.create({
    data: {
      userId,
      date: todayStr(),
      subjects: JSON.stringify(prefs),
      score,
      total: review.length,
    },
  });
  revalidatePath("/panel/quiz");
  revalidatePath("/panel/leaderboard");

  return { score, total: review.length, review };
}

/** Recent attempts for the quiz page history list. */
export async function getRecentAttempts(limit = 10) {
  const userId = await requireUserId();
  return prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, date: true, score: true, total: true, createdAt: true },
  });
}
