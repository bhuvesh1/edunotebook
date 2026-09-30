// lib/quiz/provider.ts — pluggable quiz-question providers.
//
// The daily quiz runs on DeterministicProvider (seeded, reproducible,
// taxonomy-derived questions). When an AI question generator is ready,
// implement `QuizProvider` in a new file (e.g. lib/quiz/ai-provider.ts)
// and swap it in at the single call site in app/panel/quiz/actions.ts.

import type {
  GeneratedQuestion,
  QuizGenerationInput,
} from "./generator";
import { buildQuiz } from "./generator";

export interface QuizProvider {
  /** Human-readable provider name, shown nowhere user-facing yet. */
  readonly name: string;
  generateQuestions(input: QuizGenerationInput): Promise<GeneratedQuestion[]>;
}

/** Seeded, fully deterministic provider — same input always yields the same quiz. */
export class DeterministicProvider implements QuizProvider {
  readonly name = "deterministic";

  async generateQuestions(
    input: QuizGenerationInput
  ): Promise<GeneratedQuestion[]> {
    return buildQuiz(input);
  }
}
