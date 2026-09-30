"use client";

import { useState, useTransition } from "react";
import { saveQuizPrefs } from "./actions";

export default function QuizPrefsForm({
  subjects,
  initial,
}: {
  subjects: { name: string; slug: string }[];
  initial: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const toggle = (slug: string) =>
    setSelected((prev) => {
      setSaved(false);
      return prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
    });

  const save = () =>
    startTransition(async () => {
      await saveQuizPrefs(selected);
      setSaved(true);
    });

  return (
    <div className="rounded-2xl border-2 border-[var(--rule)] bg-white/70 p-5">
      <p className="font-hand text-xl font-bold text-slate-800">
        Quiz subjects
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Pick the subjects your daily quiz draws from.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {subjects.map((s) => {
          const on = selected.includes(s.slug);
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => toggle(s.slug)}
              aria-pressed={on}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition ${
                on
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-[var(--rule)] bg-white text-slate-600 hover:border-slate-400"
              }`}
            >
              {on ? "✓ " : ""}
              {s.name}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending || selected.length === 0}
          className="font-hand rounded-lg border-2 border-slate-800 px-5 py-1.5 text-lg font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save subjects"}
        </button>
        {saved && (
          <span role="status" className="text-sm font-medium text-emerald-700">
            Saved ✓
          </span>
        )}
      </div>
    </div>
  );
}
