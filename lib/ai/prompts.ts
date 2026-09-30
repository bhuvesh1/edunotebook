// lib/ai/prompts.ts — prompt builders for the AI Content Studio.
// Each kind produces a system-style prompt that tells the model exactly what
// shape the admin review queue expects. Prompts are plain text; no API keys
// or secrets ever appear here.

export type AiJobKind = "topic-content" | "blog" | "quiz" | "translation";

export interface PromptParams {
  subjectSlug?: string;
  topicName?: string;
  input?: string;
}

export function buildPrompt(
  kind: AiJobKind,
  { subjectSlug, topicName, input }: PromptParams
): string {
  const subject = subjectSlug?.trim() || "the curriculum";
  const topic = topicName?.trim() || "the topic";
  const extra = input?.trim();

  switch (kind) {
    case "topic-content":
      return [
        `You are an expert teacher writing study content for the school curriculum subject "${subject}".`,
        ``,
        `Write a complete study article for the topic: "${topic}".`,
        `Audience: school students (grades 6–10). Language: clear, simple English with technical terms in parentheses.`,
        ``,
        `Structure the article exactly like this, using plain text with Markdown-style headings:`,
        `1. A one-line engaging title for the article.`,
        `2. "## Summary" — a 2–3 sentence summary of the topic.`,
        `3. "## Key Equations" — the essential formulas, written with ASCII math (e.g. F = m * a, v = u + a * t). If the topic has no formulas, say "None".`,
        `4. "## Explanation" — a detailed, step-by-step explanation with at least one real-life example and a solved numerical example where applicable.`,
        ``,
        `Do not invent formulas. If unsure about a detail, write "Verify with textbook" instead of guessing.`,
        extra ? `\nAdditional instructions from the editor:\n${extra}` : ``,
      ]
        .filter(Boolean)
        .join("\n");

    case "blog":
      return [
        `You are an SEO content writer for an education website covering "${subject}".`,
        ``,
        `Write an SEO article outline for the topic: "${topic}".`,
        ``,
        `Deliver, in plain text:`,
        `1. An SEO-friendly title (under 60 characters) and a meta description (under 160 characters).`,
        `2. A full article outline with H2/H3 headings, each with 2–3 bullet points describing what to cover.`,
        `3. Five long-tail keywords to target.`,
        `4. A 3-sentence opening paragraph written in a friendly tone for students.`,
        ``,
        `Keep it specific to "${topic}" — no generic filler.`,
        extra ? `\nAdditional instructions from the editor:\n${extra}` : ``,
      ]
        .filter(Boolean)
        .join("\n");

    case "quiz":
      return [
        `You are a quiz generator for school subject "${subject}".`,
        ``,
        `Create exactly 5 multiple-choice questions for the topic: "${topic}".`,
        `Difficulty: mixed (2 easy, 2 medium, 1 hard).`,
        ``,
        `Return ONLY valid JSON — no Markdown fences, no commentary — in this exact shape:`,
        `{`,
        `  "questions": [`,
        `    { "question": "...", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "..." }`,
        `  ]`,
        `}`,
        `Rules: "answer" is the 0-based index of the correct option. Every question must have exactly 4 options and a one-sentence explanation.`,
        `Do not invent formulas; if a question needs a formula you are unsure of, skip that question and write another.`,
        extra ? `\nAdditional instructions from the editor:\n${extra}` : ``,
      ]
        .filter(Boolean)
        .join("\n");

    case "translation":
      return [
        `You are a precise translator for educational content in subject "${subject}".`,
        ``,
        `Translate the following text into the target language below.`,
        `Rules:`,
        `- Preserve ALL formulas, equations, units, symbols and mathematical notation EXACTLY as written (e.g. F = m * a stays untouched).`,
        `- Preserve numbers and option labels (A/B/C/D).`,
        `- Keep the same paragraph and heading structure.`,
        `- Use a formal, student-friendly tone appropriate for a school textbook.`,
        ``,
        `Target language and text to translate:`,
        `${extra ? extra : "[No text provided — if empty, ask for the text]"}`,
      ]
        .filter(Boolean)
        .join("\n");

    default:
      // Unreachable when callers validate kind, but keep the failure loud.
      throw new Error(`Unknown AI job kind: ${kind}`);
  }
}
