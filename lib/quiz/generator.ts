// lib/quiz/generator.ts — deterministic daily-quiz question builder.
//
// Pure function (no DB, no network) so it is trivially testable and its
// output is reproducible: the same (date, userId, subjects) always produces
// the same 10 questions.
//
// Question sources, labelled honestly per question:
//  - "content":  drawn from lib/topic-content.ts quiz data (real written Q&A
//               for sim-backed topics, via matchSim). Options are the correct
//               answer plus distractors from other content answers.
//  - "template": taxonomy-derived questions (subject identification /
//               sibling-topic recognition). NEVER presented as AI-generated.

export interface QuizTopicInput {
  subjectSlug: string;
  subjectName: string;
  topicSlug: string;
  topicName: string;
}

export interface ContentQuizItem {
  q: string;
  a: string;
}

export interface GeneratedQuestion {
  id: string;
  subjectSlug: string;
  subjectName: string;
  topicSlug: string;
  topicName: string;
  question: string;
  options: string[];
  correctIndex: number;
  /** "content" = from lib/topic-content.ts quiz data; "template" = honest taxonomy-derived. */
  source: "content" | "template";
}

export interface QuizGenerationInput {
  /** YYYY-MM-DD — the quiz day; changing the date changes the quiz. */
  dateStr: string;
  /** Stable per-user id (DB user id as string). */
  userId: string;
  /** Selected subject slugs (will be sorted internally). */
  subjectSlugs: string[];
  /** All subjects (for names + distractors). */
  allSubjects: { slug: string; name: string }[];
  /** Topics available per selected subject. */
  topicsBySubject: Record<string, QuizTopicInput[]>;
  /**
   * Real quiz Q&A per topic slug, from lib/topic-content.ts via matchSim.
   * Omit/empty a topic to get an honest template question for it.
   */
  contentQuizzes: Record<string, ContentQuizItem[]>;
  /** Number of questions (default 10). */
  count?: number;
}

/** FNV-1a 32-bit hash of a string. */
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — deterministic, seedable. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic Fisher–Yates shuffle using the provided rng. */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildContentQuestion(
  topic: QuizTopicInput,
  items: ContentQuizItem[],
  allAnswers: string[],
  rng: () => number,
  qid: string
): GeneratedQuestion | null {
  const item = items[Math.floor(rng() * items.length)];
  const correct = item.a.trim();
  // Distractors: other real answers from the content pool, excluding the correct one.
  const pool = shuffle(
    allAnswers.filter((a) => a.trim() && a.trim() !== correct),
    rng
  );
  const unique: string[] = [];
  for (const a of pool) {
    const t = a.trim();
    if (t && t !== correct && !unique.includes(t)) unique.push(t);
    if (unique.length === 3) break;
  }
  if (unique.length < 3) return null; // not enough distinct distractors — caller falls back to template
  const options = shuffle([correct, ...unique], rng);
  return {
    id: qid,
    subjectSlug: topic.subjectSlug,
    subjectName: topic.subjectName,
    topicSlug: topic.topicSlug,
    topicName: topic.topicName,
    question: item.q,
    options,
    correctIndex: options.indexOf(correct),
    source: "content",
  };
}

function buildTemplateQuestion(
  topic: QuizTopicInput,
  allSubjects: { slug: string; name: string }[],
  sameSubjectTopics: QuizTopicInput[],
  otherSubjectTopics: QuizTopicInput[],
  rng: () => number,
  qid: string,
  variant: number
): GeneratedQuestion {
  const others = shuffle(
    allSubjects.filter((s) => s.slug !== topic.subjectSlug),
    rng
  );
  if (variant % 2 === 0 && others.length >= 3) {
    const options = shuffle(
      [topic.subjectName, ...others.slice(0, 3).map((s) => s.name)],
      rng
    );
    return {
      id: qid,
      subjectSlug: topic.subjectSlug,
      subjectName: topic.subjectName,
      topicSlug: topic.topicSlug,
      topicName: topic.topicName,
      question: `The topic “${topic.topicName}” is studied under which subject?`,
      options,
      correctIndex: options.indexOf(topic.subjectName),
      source: "template",
    };
  }
  // Variant B (taxonomy-derived): recognise a sibling topic from the same subject.
  const siblingPool = sameSubjectTopics.filter(
    (t) => t.topicSlug !== topic.topicSlug
  );
  const correct =
    siblingPool.length > 0
      ? siblingPool[Math.floor(rng() * siblingPool.length)].topicName
      : topic.topicName;
  const distractors = shuffle(otherSubjectTopics, rng)
    .map((t) => t.topicName)
    .filter((n) => n !== correct && n !== topic.topicName);
  const unique: string[] = [];
  for (const n of distractors) {
    if (!unique.includes(n)) unique.push(n);
    if (unique.length === 3) break;
  }
  // Fallback: pad with subject names (still taxonomy-derived, never fake).
  const fallbackSubjects = shuffle(
    allSubjects
      .filter((s) => s.slug !== topic.subjectSlug)
      .map((s) => s.name),
    rng
  );
  let fi = 0;
  while (unique.length < 3 && fi < fallbackSubjects.length) {
    const cand = `A topic in ${fallbackSubjects[fi]}`;
    if (!unique.includes(cand) && cand !== correct) unique.push(cand);
    fi++;
  }
  const options = shuffle([correct, ...unique], rng);
  return {
    id: qid,
    subjectSlug: topic.subjectSlug,
    subjectName: topic.subjectName,
    topicSlug: topic.topicSlug,
    topicName: topic.topicName,
    question: `Which of the following is also a topic in ${topic.subjectName}, like “${topic.topicName}”?`,
    options,
    correctIndex: options.indexOf(correct),
    source: "template",
  };
}

export function buildQuiz(input: QuizGenerationInput): GeneratedQuestion[] {
  const count = input.count ?? 10;
  const subjects = [...input.subjectSlugs].sort();
  if (subjects.length === 0) return [];

  const seedStr = `${input.dateStr}|${input.userId}|${subjects.join(",")}`;
  const rng = mulberry32(hashString(seedStr));

  // All content answers across the quiz, for MCQ distractors.
  const allAnswers = Object.values(input.contentQuizzes)
    .flat()
    .map((i) => i.a);

  const allTopics = subjects.flatMap((s) => input.topicsBySubject[s] ?? []);
  const shuffledBySubject: Record<string, QuizTopicInput[]> = {};
  for (const s of subjects) {
    shuffledBySubject[s] = shuffle(input.topicsBySubject[s] ?? [], rng);
  }

  const questions: GeneratedQuestion[] = [];
  const used = new Set<string>(); // "subjectSlug/topicSlug:variant"
  let qi = 0;

  // Round-robin across selected subjects so every subject is represented.
  outer: for (let round = 0; round < 200; round++) {
    for (const s of subjects) {
      const list = shuffledBySubject[s];
      if (list.length === 0) continue;
      const topic = list[round % list.length];
      const variant = Math.floor(rng() * 2);
      const key = `${s}/${topic.topicSlug}:${variant}`;
      if (used.has(key)) continue;
      used.add(key);

      const qid = `q${qi + 1}`;
      const items = input.contentQuizzes[topic.topicSlug];
      let q: GeneratedQuestion | null = null;
      if (items && items.length > 0) {
        q = buildContentQuestion(topic, items, allAnswers, rng, qid);
      }
      if (!q) {
        q = buildTemplateQuestion(
          topic,
          input.allSubjects,
          input.topicsBySubject[s] ?? [],
          allTopics.filter((t) => t.subjectSlug !== s),
          rng,
          qid,
          variant
        );
      }
      questions.push(q);
      qi++;
      if (questions.length >= count) break outer;
    }
    // Stop if every (topic, variant) combo is exhausted.
    const exhausted = subjects.every((s) =>
      (input.topicsBySubject[s] ?? []).every(
        (t) => used.has(`${s}/${t.topicSlug}:0`) && used.has(`${s}/${t.topicSlug}:1`)
      )
    );
    if (exhausted) break;
  }

  return questions;
}
