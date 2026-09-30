// Per-subject creative metadata for the subject home pages (Phase 2).
// Keyed by subject slug from data/taxonomy.json. Real copy only —
// never lorem ipsum.

export type SubjectSlug =
  | "physics"
  | "chemistry"
  | "biology"
  | "mathematics"
  | "engineering"
  | "mbbs"
  | "dental";

export type HeroKind =
  | "solar"
  | "anatomy"
  | "lab"
  | "math"
  | "blueprint"
  | "ecg"
  | "tooth";

export interface SubjectMeta {
  /** 1–2 inspiring lines shown beside/below the hero. */
  tagline: string;
  /** Which animated hero scene renders for this subject. */
  heroKind: HeroKind;
  /** Accent color used for small hero flourishes on the page. */
  accent: string;
}

export const SUBJECT_META: Record<SubjectSlug, SubjectMeta> = {
  physics: {
    tagline:
      "Without physics, nothing moves — master the laws that run the universe.",
    heroKind: "solar",
    accent: "#f59e0b",
  },
  chemistry: {
    tagline:
      "Everything around you is chemistry — learn the reactions that shape our world.",
    heroKind: "lab",
    accent: "#10b981",
  },
  biology: {
    tagline:
      "Life itself is the syllabus — from a single cell to the whole living world.",
    heroKind: "anatomy",
    accent: "#ec4899",
  },
  mathematics: {
    tagline:
      "The universe is written in mathematics — learn to read it fluently.",
    heroKind: "math",
    accent: "#6366f1",
  },
  engineering: {
    tagline:
      "Ideas become machines here — build the skills that build the future.",
    heroKind: "blueprint",
    accent: "#0ea5e9",
  },
  mbbs: {
    tagline:
      "The human body is your textbook — train to heal, to diagnose, to save lives.",
    heroKind: "ecg",
    accent: "#ef4444",
  },
  dental: {
    tagline:
      "Every smile has science behind it — master the art of oral health.",
    heroKind: "tooth",
    accent: "#14b8a6",
  },
};

/** Look up meta by slug; undefined for unknown slugs. */
export function getSubjectMeta(slug: string): SubjectMeta | undefined {
  return (SUBJECT_META as Record<string, SubjectMeta>)[slug];
}
