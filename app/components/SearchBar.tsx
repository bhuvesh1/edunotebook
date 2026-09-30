"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Result = {
  id: number;
  name: string;
  url: string;
  subject: string;
  category: string;
  subcategory: string;
};

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full max-w-xs">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search topics…"
        aria-label="Search topics"
        className="w-full rounded-full border border-[var(--rule)] bg-white/80 px-4 py-1.5 text-sm outline-none focus:border-slate-400 placeholder:text-slate-400"
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-xl border border-[var(--rule)] bg-white shadow-lg text-left">
          {loading && (
            <div className="px-4 py-3 text-sm text-slate-500">Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-500">
              No topics found.
            </div>
          )}
          {results.map((r) => (
            <Link
              key={r.id}
              href={r.url}
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
              className="block px-4 py-2.5 hover:bg-slate-100 border-b border-slate-100 last:border-0"
            >
              <div className="text-sm font-medium text-slate-800">{r.name}</div>
              <div className="text-xs text-slate-500">
                {r.subject} › {r.category}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
