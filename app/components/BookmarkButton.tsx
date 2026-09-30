"use client";

import { useEffect, useState } from "react";
import { isBookmarked, toggleBookmark } from "../actions/bookmarks";

interface BookmarkButtonProps {
  kind: "topic" | "blog";
  /** topic: "<subjectSlug>/<topicSlug>"; blog: "<blogSlug>" */
  slug: string;
}

/**
 * Small bookmark toggle for topic and blog pages.
 * Renders nothing when logged out (checked via /api/session).
 */
export default function BookmarkButton({ kind, slug }: BookmarkButtonProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [marked, setMarked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data?.user) {
          setLoggedIn(true);
          setMarked(await isBookmarked(kind, slug));
        }
      } catch {
        /* stay hidden on any failure */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, slug]);

  if (!loggedIn) return null;

  const onClick = async () => {
    setBusy(true);
    try {
      setMarked(await toggleBookmark(kind, slug));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-pressed={marked}
      title={marked ? "Remove bookmark" : "Bookmark this"}
      className={`font-hand rounded-full border-2 px-3 py-1 text-sm font-bold transition disabled:opacity-50 ${
        marked
          ? "border-amber-500 bg-amber-100 text-amber-800"
          : "border-[var(--rule)] bg-white/70 text-slate-600 hover:border-amber-400"
      }`}
    >
      {marked ? "★ Bookmarked" : "☆ Bookmark"}
    </button>
  );
}
