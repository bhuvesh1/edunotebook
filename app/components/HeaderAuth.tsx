import Link from "next/link";
import { auth } from "@/auth";

/**
 * Header auth slot — server component rendered in the root layout header.
 * Shows "Panel" (+ Ask) only when logged in; otherwise a Login link.
 * The fixed 7-subject nav is untouched.
 */
export default async function HeaderAuth() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="font-hand rounded-full border-2 border-[var(--rule)] bg-white/70 px-4 py-1 text-base font-bold text-slate-700 hover:border-slate-400"
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <span className="hidden text-slate-500 sm:inline">
        Hi, {session.user.name ?? session.user.email}
      </span>
      <Link
        href="/ask"
        className="font-hand rounded-full border-2 border-[var(--rule)] bg-white/70 px-4 py-1 text-base font-bold text-slate-700 hover:border-slate-400"
      >
        Ask
      </Link>
      <Link
        href="/panel"
        className="font-hand rounded-full border-2 border-slate-800 bg-slate-800 px-4 py-1 text-base font-bold text-white hover:bg-slate-700"
      >
        Panel
      </Link>
    </div>
  );
}
