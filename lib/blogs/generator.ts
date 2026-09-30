// lib/blogs/generator.ts
// Deterministic, SEO-ready blog post generator — one blog per topic.
//
// Pure function: same input always yields the same output, no I/O, no AI.
// Tailored content comes from lib/topic-content.ts (the 8 flagship sim
// bundles) when the topic matches one; everything else gets an honest,
// topically-grounded write-up built from the topic's own taxonomy context
// (never lorem ipsum, never fabricated equations).

import { matchSim } from "../simulations/registry";
import { getTopicContent } from "../topic-content";

/** Escape HTML special chars so topic names can never inject markup. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface SiblingRef {
  name: string;
  /** Full blog slug ("<subjectSlug>-<topicSlug>") — used for /blog/ links. */
  slug: string;
}

export interface BuildBlogInput {
  /** Full blog slug, unique across all subjects ("<subjectSlug>-<topicSlug>"). */
  slug: string;
  subject: string;
  subjectSlug: string;
  category: string;
  subcategory: string;
  topic: string;
  topicSlug: string;
  /** Sibling blogs in the same subcategory (full blog slugs), self excluded. */
  siblings: SiblingRef[];
}

export interface BuiltBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  summary: string;
  equationsHtml: string;
  detailHtml: string;
  relatedPapers: { title: string; url: string }[];
  relatedSlugs: string[];
}

/**
 * Deterministically pick 4–6 related blog slugs.
 * Prefers siblings from the same subcategory; falls back to supplied
 * siblings (callers may pass same-subject neighbours when the subcategory
 * is too small). Self is always excluded.
 */
function pickRelatedSlugs(selfSlug: string, siblings: SiblingRef[]): string[] {
  const slugs = siblings
    .filter((s) => s.slug !== selfSlug)
    .map((s) => s.slug);
  // Deterministic: keep taxonomy order, take 4–6.
  return slugs.slice(0, 6);
}

/**
 * Build one blog post from a topic's taxonomy context.
 * All strings are HTML-safe: raw names are escaped before interpolating.
 */
export function buildBlogPost(input: BuildBlogInput): BuiltBlogPost {
  const { slug, subject, subjectSlug, category, subcategory, topic } = input;

  const esc = {
    topic: escapeHtml(topic),
    subject: escapeHtml(subject),
    subjectSlug: escapeHtml(subjectSlug),
    category: escapeHtml(category),
    subcategory: escapeHtml(subcategory),
  };

  const title = `${topic} Explained with Examples`;
  const tailored = matchSim(topic) !== null;
  const content = getTopicContent(matchSim(topic));

  // ---- Excerpt: 2–3 line summary ----
  const excerpt = tailored
    ? `${topic} is a core ${category} concept in ${subject}. ` +
      `This guide explains what it is, walks through a fully worked example, ` +
      `and lists the key equations you need — with a short quiz to test yourself.`
    : `${topic} is part of ${subcategory} in ${subject}. ` +
      `This guide covers what it means, the key ideas to master, ` +
      `and a practical study approach that works for this topic.`;

  const summary =
    `A concise, example-driven guide to ${topic} — definitions, key ideas, ` +
    `equations and a study checklist for ${subject} learners.`;

  // ---- Equations / worked-example section ----
  let equationsHtml: string;
  if (tailored) {
    const equationItems = content.equations
      .map((eq) => `      <li><code>${escapeHtml(eq)}</code></li>`)
      .join("\n");
    equationsHtml =
      `<h2>Key equations and worked example</h2>\n` +
      `<p>${escapeHtml(content.example)}</p>\n` +
      `<ul>\n${equationItems}\n    </ul>`;
  } else {
    // Honest generic list — study-oriented key ideas, never fabricated equations.
    equationsHtml =
      `<h2>Key ideas to master</h2>\n` +
      `<p>The core of ${esc.topic} comes down to a few key ideas:</p>\n` +
      `<ul>\n` +
      `      <li><strong>The exact definition.</strong> Learn the precise meaning of ${esc.topic} as used in ${esc.subject} — most exam questions test whether you can apply the definition, not just recite it.</li>\n` +
      `      <li><strong>The governing principle.</strong> Every topic in ${esc.subcategory} is built on one central rule, relationship or equation. Identify it, write it down, and name what each symbol means and its units.</li>\n` +
      `      <li><strong>One worked example.</strong> Solve a single numerical or example start to finish — that one solution teaches more than re-reading the chapter three times.</li>\n` +
      `      <li><strong>The real-world link.</strong> Connect ${esc.topic} to something you have seen in daily life; concrete anchors make the abstract part stick.</li>\n` +
      `    </ul>`;
  }

  // ---- Detail: 3–5 short paragraphs, topically grounded ----
  const paragraphs: string[] = [];
  if (tailored) {
    paragraphs.push(
      `<p><strong>${esc.topic}</strong> is one of the central ideas in ${esc.category}, and it appears in ${esc.subject} curricula under ${esc.subcategory}. ` +
        `It is worth learning deeply because it connects to so many other topics in this section.</p>`
    );
    paragraphs.push(`<p>${escapeHtml(content.theory)}</p>`);
    paragraphs.push(
      `<p>For exams, the pattern is predictable: first a definition or statement of the result, then a direct ` +
        `numerical application of one of the equations above, then a "why" question — why the formula takes ` +
        `that form, or what changes when a variable is doubled or halved. The worked example and quiz below cover exactly that progression.</p>`
    );
    if (content.quiz.length > 0) {
      const quizItems = content.quiz
        .map(
          (q) =>
            `      <li><strong>Q:</strong> ${escapeHtml(q.q)}<br /><strong>A:</strong> ${escapeHtml(q.a)}</li>`
        )
        .join("\n");
      paragraphs.push(
        `<p><strong>Quick self-check:</strong></p>\n    <ul>\n${quizItems}\n    </ul>`
      );
    }
  } else {
    paragraphs.push(
      `<p><strong>${esc.topic}</strong> belongs to ${esc.subcategory}, which sits inside ${esc.category} in ${esc.subject}. ` +
        `Understanding how a topic fits into this bigger picture is the fastest way to remember it: ` +
        `each idea here builds on the ones before it in this section.</p>`
    );
    paragraphs.push(
      `<p>Start with the definition. Before touching any formula, you should be able to explain ${esc.topic} ` +
        `in one or two sentences to a friend — if you cannot, the definition is where the gap is. ` +
        `Then find the governing equation or principle for this topic and write it out by hand, labelling every symbol with its meaning and units. ` +
        `Named symbols turn a memorised formula into a usable tool.</p>`
    );
    paragraphs.push(
      `<p>Next, work one example end to end. Pick a textbook or previous-year question on ${esc.topic}, ` +
        `solve it without peeking, and then check each step. Pay special attention to units and sign ` +
        `conventions — they are where most marks are lost in ${esc.subject}.</p>`
    );
    paragraphs.push(
      `<p>Finally, connect it to the real world. Every topic in ${esc.subcategory} describes something you ` +
        `can observe or build; finding that link makes the abstract parts memorable and gives you something ` +
        `concrete to write about in descriptive answers.</p>`
    );
  }

  const detailHtml =
    `<h2>${esc.topic} in detail</h2>\n` + paragraphs.join("\n");

  return {
    slug,
    title,
    excerpt,
    summary,
    equationsHtml,
    detailHtml,
    relatedPapers: [],
    relatedSlugs: pickRelatedSlugs(slug, input.siblings),
  };
}

/**
 * Assemble the full article body stored in BlogPost.contentHtml.
 * Kept separate so the page renderer and the seed share one assembly.
 */
export function assembleContentHtml(post: BuiltBlogPost): string {
  return (
    `<p class="lead">${escapeHtml(post.excerpt)}</p>\n` +
    post.equationsHtml +
    `\n` +
    post.detailHtml
  );
}
