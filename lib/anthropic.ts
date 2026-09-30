// lib/anthropic.ts
// Server-only helper for the Anthropic Messages API (direct fetch, no SDK).
// Used by Ask Me Anything to answer student questions with Claude.

const API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are EduNotebook's friendly AI tutor for Indian school and college students (classes 6-12, UG level). Answer the student's question clearly and correctly.

Rules:
- Reply in the SAME language/script the student used (English, Hindi, or Hinglish).
- Be exam-oriented: clear explanation, then a short example if it helps.
- Keep it focused: aim for under 350 words unless the question needs more.
- Use short paragraphs and simple bullet points where helpful. No excessive formatting.
- If the question is not educational (personal advice, disallowed content, etc.), politely decline in one line and suggest asking a study question instead.
- Never make up citations, links, or references. If unsure, say what is known and what isn't.`;

export async function answerWithClaude(opts: {
  question: string;
  subjectName: string | null;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  // Override via env if Anthropic renames models; default is the cheap smart tier.
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

  const userContent = opts.subjectName
    ? `Subject: ${opts.subjectName}\n\nQuestion: ${opts.question}`
    : `Question: ${opts.question}`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Claude API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = Array.isArray(data.content)
    ? data.content
        .filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("\n")
        .trim()
    : "";

  if (!text) throw new Error("Claude returned an empty answer");
  return text;
}
