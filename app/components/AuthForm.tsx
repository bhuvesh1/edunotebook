"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "../login/actions";

interface AuthFormProps {
  action: (
    prev: AuthFormState,
    formData: FormData
  ) => Promise<AuthFormState>;
  mode: "login" | "signup";
  callbackUrl?: string;
}

const initialState: AuthFormState = { error: null };

/** Shared notebook-styled auth form for /login and /signup. */
export default function AuthForm({ action, mode, callbackUrl }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}

      {mode === "signup" && (
        <div>
          <label
            htmlFor="auth-name"
            className="font-hand text-lg font-semibold text-slate-800"
          >
            Name
          </label>
          <input
            id="auth-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            className="mt-1 w-full rounded-lg border-2 border-[var(--rule)] bg-white px-4 py-2.5 text-slate-800 focus:border-[var(--margin-line)] focus:outline-none"
            placeholder="Your name"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="auth-email"
          className="font-hand text-lg font-semibold text-slate-800"
        >
          Email
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={160}
          className="mt-1 w-full rounded-lg border-2 border-[var(--rule)] bg-white px-4 py-2.5 text-slate-800 focus:border-[var(--margin-line)] focus:outline-none"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="auth-password"
          className="font-hand text-lg font-semibold text-slate-800"
        >
          Password
          {mode === "signup" && (
            <span className="ml-2 text-sm font-normal text-slate-500">
              (min 8 characters)
            </span>
          )}
        </label>
        <input
          id="auth-password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={mode === "signup" ? 8 : 1}
          className="mt-1 w-full rounded-lg border-2 border-[var(--rule)] bg-white px-4 py-2.5 text-slate-800 focus:border-[var(--margin-line)] focus:outline-none"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="font-hand w-full rounded-lg bg-slate-800 px-4 py-3 text-xl font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {pending
          ? mode === "signup"
            ? "Creating account…"
            : "Logging in…"
          : mode === "signup"
            ? "Create account"
            : "Log in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-slate-800 underline decoration-[var(--margin-line)] underline-offset-4"
            >
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link
              href="/signup"
              className="font-semibold text-slate-800 underline decoration-[var(--margin-line)] underline-offset-4"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
