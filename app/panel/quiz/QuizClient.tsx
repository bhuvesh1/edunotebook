"use client";

import { useState } from "react";
import {
  getDailyQuiz,
  submitQuiz,
  type QuizAnswer,
  type QuizResult,
} from "./actions";
import type { GeneratedQuestion } from "@/lib/quiz/generator";

type Phase = "idle" | "loading" | "answering" | "grading" | "done";

/** Interactive daily-quiz runner: one question at a time, progress, review. */
export default function QuizClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setPhase("loading");
    setError(null);
    try {
      const qs = await getDailyQuiz();
      if (qs.length === 0) {
        setError("No questions could be built — select at least one subject above.");
        setPhase("idle");
        return;
      }
      setQuestions(qs);
      setIndex(0);
      setAnswers([]);
      setSelected(null);
      setResult(null);
      setPhase("answering");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the quiz.");
      setPhase("idle");
    }
  };

  const next = () => {
    if (selected === null) return;
    const q = questions[index];
    const nextAnswers = [...answers, { id: q.id, selectedIndex: selected }];
    setAnswers(nextAnswers);
    setSelected(null);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      grade(nextAnswers);
    }
  };

  const grade = async (finalAnswers: QuizAnswer[]) => {
    setPhase("grading");
    try {
      const r = await submitQuiz(finalAnswers);
      setResult(r);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your result.");
      setPhase("idle");
    }
  };

  if (phase === "idle" || phase === "loading") {
    return (
      <div className="mt-6">
        <button
          onClick={start}
          disabled={phase === "loading"}
          className="font-hand rounded-lg bg-slate-800 px-6 py-3 text-xl font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {phase === "loading" ? "Building your quiz…" : "Start daily quiz"}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <p className="mt-3 text-sm text-slate-500">
          10 questions, same set for everyone all day — it changes tomorrow.
        </p>
      </div>
    );
  }

  if (phase === "grading") {
    return <p className="font-hand mt-6 text-2xl text-slate-700">Checking your answers…</p>;
  }

  if (phase === "done" && result) {
    return (
      <div className="mt-6">
        <div className="rounded-2xl border-2 border-[var(--rule)] bg-white/70 p-6 text-center">
          <p className="font-hand text-3xl font-bold text-slate-800">
            You scored {result.score} / {result.total}
          </p>
          <p className="mt-2 text-slate-600">
            {result.score === result.total
              ? "Perfect — brilliant revision!"
              : result.score >= result.total * 0.7
                ? "Strong work — review the ones you missed below."
                : "Good effort — the review below shows what to revise."}
          </p>
          <button
            onClick={() => {
              setPhase("idle");
              setResult(null);
            }}
            className="font-hand mt-4 rounded-lg border-2 border-slate-800 px-5 py-2 text-lg font-bold text-slate-800 hover:bg-slate-100"
          >
            Back
          </button>
        </div>

        <h4 className="font-hand mt-8 text-2xl font-bold text-slate-800">
          Review
        </h4>
        <ul className="mt-4 space-y-4">
          {result.review.map((r) => (
            <li
              key={r.id}
              className={`rounded-xl border-2 p-4 ${
                r.correct
                  ? "border-emerald-300 bg-emerald-50/60"
                  : "border-red-200 bg-red-50/60"
              }`}
            >
              <p className="font-medium text-slate-800">{r.question}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {r.options.map((opt, oi) => {
                  const isCorrect = oi === r.correctIndex;
                  const isPicked = oi === r.selectedIndex;
                  return (
                    <li
                      key={oi}
                      className={`rounded px-2 py-1 ${
                        isCorrect
                          ? "bg-emerald-100 font-semibold text-emerald-900"
                          : isPicked
                            ? "bg-red-100 text-red-900 line-through"
                            : "text-slate-600"
                      }`}
                    >
                      {isCorrect ? "✓ " : isPicked ? "✗ " : "· "}
                      {opt}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs italic text-slate-500">
                {r.correct ? "Correct" : "Missed"} ·{" "}
                {r.source === "content"
                  ? "from this topic's study notes"
                  : "study-habit question (auto-generated from the syllabus, not AI-written)"}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const q = questions[index];
  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span className="rounded-full border border-[var(--rule)] px-2.5 py-0.5 text-xs font-semibold">
          {q.subjectName}
        </span>
      </div>
      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
      >
        <div
          className="h-full rounded-full bg-[var(--margin-line)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-5 text-lg font-medium text-slate-800">{q.question}</p>

      <ul className="mt-4 space-y-2">
        {q.options.map((opt, oi) => (
          <li key={oi}>
            <button
              onClick={() => setSelected(oi)}
              className={`w-full rounded-lg border-2 px-4 py-2.5 text-left transition ${
                selected === oi
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-[var(--rule)] bg-white/70 text-slate-700 hover:border-slate-400"
              }`}
            >
              {opt}
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={next}
        disabled={selected === null}
        className="font-hand mt-5 rounded-lg bg-slate-800 px-6 py-2.5 text-xl font-bold text-white transition hover:bg-slate-700 disabled:opacity-40"
      >
        {index + 1 < questions.length ? "Next →" : "Finish & check"}
      </button>
    </div>
  );
}
