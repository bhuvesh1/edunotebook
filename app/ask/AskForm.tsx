"use client";

import { useActionState, useEffect, useRef } from "react";
import { askQuestionAction, type AskFormState } from "./actions";

const initialState: AskFormState = { error: null, ok: false };

export default function AskForm({
  subjects,
}: {
  subjects: { name: string; slug: string }[];
}) {
  const [state, formAction, pending] = useActionState(askQuestionAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 rounded-2xl border-2 border-[var(--rule)] bg-white/70 p-5 sm:p-6"
    >
      <div>
        <label
          htmlFor="ask-subject"
          className="font-hand text-lg font-semibold text-slate-800"
        >
          Subject
        </label>
        <select
          id="ask-subject"
          name="subjectSlug"
          className="mt-1 w-full rounded-lg border-2 border-[var(--rule)] bg-white px-4 py-2.5 text-slate-800 focus:border-[var(--margin-line)] focus:outline-none"
        >
          <option value="">General (no specific subject)</option>
          {subjects.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label
          htmlFor="ask-question"
          className="font-hand text-lg font-semibold text-slate-800"
        >
          Your question
        </label>
        <textarea
          id="ask-question"
          name="question"
          required
          rows={4}
          maxLength={2000}
          placeholder="e.g. Why is the sky blue? Explain it like I'm revising for an exam."
          className="mt-1 w-full rounded-lg border-2 border-[var(--rule)] bg-white px-4 py-2.5 text-slate-800 focus:border-[var(--margin-line)] focus:outline-none"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      )}
      {state.ok && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700"
        >
          Question saved — thank you!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="font-hand mt-4 rounded-lg bg-slate-800 px-6 py-2.5 text-xl font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Ask question"}
      </button>
    </form>
  );
}
