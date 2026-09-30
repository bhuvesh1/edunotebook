// app/components/sims/LazyUploadedModelViewer.tsx
// Thin client wrapper that lazy-loads the real UploadedModelViewer.
//
// WHY: UploadedModelViewer statically imports @react-three/fiber + drei.
// If a topic page imported it directly, three.js would be bundled into
// EVERY topic page's JS — including mathematics topics, which must never
// load 3D. Through next/dynamic (ssr: false) inside this client component,
// the heavy chunk is fetched only when an uploaded model actually renders.

"use client";

import dynamic from "next/dynamic";

const UploadedModelViewer = dynamic(
  () =>
    import("./UploadedModelViewer").then((m) => m.UploadedModelViewer),
  { ssr: false }
);

export function LazyUploadedModelViewer({ url }: { url: string }) {
  return <UploadedModelViewer url={url} />;
}
