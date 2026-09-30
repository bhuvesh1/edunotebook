"use client";

import { useActionState, useEffect, useRef } from "react";
import { addSuggestionAction } from "./actions";

const initial = { error: null as string | null, ok: false };

export default function SuggestionForm() {
  const [state, formAction, pending] = useActionState(addSuggestionAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-5 rounded-2xl border-2 border-[var(--rule)] bg-white/70 p-5"
    >
      <label
        htmlFor="suggestion-text"
        className="font-hand text-xl font-bold text-slate-800"
      >
        New suggestion
      </label>
      <p className="mt-1 text-sm text-slate-500">
        A topic you&apos;d like covered, a feature idea, anything.
      </p>
      <textarea
        id="suggestion-text"
        name="text"
        required
        rows={3}
        maxLength={2000}
        placeholder="e.g. Please add a topic on black holes with a 3D simulation."
        className="mt-3 w-full rounded-lg border-2 border-[var(--rule)] bg-white px-4 py-2.5 text-slate-800 focus:border-[var(--margin-line)] focus:outline-none"
      />
      {state.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="mt-3 text-sm font-medium text-emerald-700">
          Thanks — your suggestion was saved!
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="font-hand mt-3 rounded-lg bg-slate-800 px-6 py-2 text-xl font-bold text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Send suggestion"}
      </button>
    </form>
  );
}
