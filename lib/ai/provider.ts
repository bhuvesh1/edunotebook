// lib/ai/provider.ts — AI text-generation providers for the AI Content Studio.
// Server-only: the Gemini API key lives in the server environment and is
// NEVER logged, never exposed to the client, and never interpolated into
// anything the UI renders.

export interface AIProvider {
  readonly name: string;
  generateText(prompt: string): Promise<string>;
}

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
}

/** Google Gemini text generation via the v1beta generateContent endpoint. */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "AI provider not configured — set GEMINI_API_KEY in the server .env, then retry."
      );
    }
  }

  async generateText(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY as string;
    let res: Response;
    try {
      res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
    } catch (err) {
      throw new Error(
        `Gemini request failed: ${err instanceof Error ? err.message : "network error"}`
      );
    }

    let data: GeminiApiResponse;
    try {
      data = (await res.json()) as GeminiApiResponse;
    } catch {
      throw new Error(`Gemini request failed: HTTP ${res.status} (unparseable response)`);
    }

    if (!res.ok) {
      throw new Error(`Gemini API error: ${data.error?.message ?? `HTTP ${res.status}`}`);
    }

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? "").join("").trim();
    if (!text) {
      throw new Error("Gemini returned no text content (empty candidates).");
    }
    return text;
  }
}

/** Honest fallback when no provider is configured: fails with a clear message. */
export class NullProvider implements AIProvider {
  readonly name = "unconfigured";

  async generateText(_prompt: string): Promise<string> {
    throw new Error(
      "AI provider not configured — set GEMINI_API_KEY in the server .env, then retry."
    );
  }
}

/** Gemini when GEMINI_API_KEY is set, otherwise a NullProvider that fails honestly. */
export function getAIProvider(): AIProvider {
  if (process.env.GEMINI_API_KEY) return new GeminiProvider();
  return new NullProvider();
}

/** For the provider status card: configured boolean only — never the key itself. */
export function isProviderConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
