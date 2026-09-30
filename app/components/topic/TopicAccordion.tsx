// app/components/topic/TopicAccordion.tsx
// Client accordion for the topic page sections: Example → Theory →
// Equations → Quiz. One button per section; clicking expands it below.
// Quiz questions each get a show-answer toggle.

"use client";

import { useState } from "react";
import type { TopicContent } from "../../../lib/topic-content";

const SECTIONS = ["example", "theory", "equations", "quiz"] as const;
type SectionId = (typeof SECTIONS)[number];

const TITLES: Record<SectionId, string> = {
  example: "Worked example",
  theory: "Theory",
  equations: "Key equations",
  quiz: "Quick quiz",
};

export function TopicAccordion({ content }: { content: TopicContent }) {
  const [open, setOpen] = useState<SectionId | null>("example");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [lang, setLang] = useState<"en" | "hi">("en");

  const hasHindi = Boolean(content.theoryHi && content.exampleHi);

  // Pick the right language version of each section.
  const example = lang === "hi" && content.exampleHi ? content.exampleHi : content.example;
  const theory = lang === "hi" && content.theoryHi ? content.theoryHi : content.theory;
  const equations =
    lang === "hi" && content.equationsHi && content.equationsHi.length > 0
      ? content.equationsHi
      : content.equations;
  const quiz =
    lang === "hi" && content.quizHi && content.quizHi.length > 0
      ? content.quizHi
      : content.quiz;

  const toggleAnswer = (i: number) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const switchLang = (l: "en" | "hi") => {
    setLang(l);
    setRevealed(new Set());
  };

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-hand text-2xl font-bold text-slate-800">
          Study notes
        </h3>
        {hasHindi && (
          <div
            role="group"
            aria-label="Language"
            className="flex overflow-hidden rounded-full border-2 border-[var(--rule)] bg-white text-sm font-bold"
          >
            <button
              type="button"
              onClick={() => switchLang("en")}
              aria-pressed={lang === "en"}
              className={`px-4 py-1.5 transition-colors ${
                lang === "en"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => switchLang("hi")}
              aria-pressed={lang === "hi"}
              className={`px-4 py-1.5 transition-colors ${
                lang === "hi"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              हिन्दी
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-3">
        {SECTIONS.map((id) => {
          const isOpen = open === id;
          return (
            <div
              key={id}
              className="overflow-hidden rounded-xl border-2 border-[var(--rule)] bg-white/70"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
              >
                <span className="font-hand text-xl font-bold text-slate-800">
                  {TITLES[id]}
                </span>
                <span
                  aria-hidden="true"
                  className={`text-xl font-bold text-slate-500 transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-[var(--rule)] px-4 py-4 sm:px-5">
                  {id === "example" && (
                    <p className="leading-relaxed text-slate-700">{example}</p>
                  )}
                  {id === "theory" && (
                    <p className="leading-relaxed text-slate-700">{theory}</p>
                  )}
                  {id === "equations" && (
                    <ul className="space-y-2">
                      {equations.map((eq, i) => (
                        <li
                          key={i}
                          className="rounded-lg bg-slate-900 px-4 py-2.5 font-mono text-sm text-amber-200"
                        >
                          {eq}
                        </li>
                      ))}
                    </ul>
                  )}
                  {id === "quiz" && (
                    <ol className="space-y-4">
                      {quiz.map((item, i) => (
                        <li key={i} className="rounded-lg bg-slate-50 p-4">
                          <p className="font-semibold text-slate-800">
                            <span className="mr-2 text-slate-400">Q{i + 1}.</span>
                            {item.q}
                          </p>
                          <button
                            type="button"
                            onClick={() => toggleAnswer(i)}
                            className="mt-2 rounded-md border border-[var(--rule)] bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            {revealed.has(i) ? "Hide answer" : "Show answer"}
                          </button>
                          {revealed.has(i) && (
                            <p className="mt-2 border-l-4 border-emerald-400 bg-emerald-50 px-3 py-2 text-sm text-slate-700">
                              {item.a}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
