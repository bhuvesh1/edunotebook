"use client";

import { useEffect, useRef } from "react";
import { recordView } from "@/lib/actions/track";

interface TrackViewProps {
  subjectSlug: string;
  topicSlug?: string;
  kind: "topic" | "blog";
}

/** Fire-and-forget view tracker for the Reading panel. Renders nothing. */
export default function TrackView({ subjectSlug, topicSlug, kind }: TrackViewProps) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    recordView({ subjectSlug, topicSlug, kind });
  }, [subjectSlug, topicSlug, kind]);
  return null;
}
