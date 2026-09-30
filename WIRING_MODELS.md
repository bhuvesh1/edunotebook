# WIRING_MODELS.md — pasting the uploaded-model hook into the topic page

Owner: the topic-page integrator (Worker owning `app/topic/**`).
Everything the hook needs already exists: `getModelForTopic` in `lib/models.ts`
and the client component in `app/components/sims/UploadedModelViewer.tsx`.

## Where

`app/topic/[subject]/[topicSlug]/page.tsx`, at the `{/* UPLOADED_MODEL_HOOK */}`
marker (inside the 3D/sim section of the page).

> NOTE (2026-09-29): the marker does not exist in the topic page yet — the
> topic page is owned by another worker. Place the snippet below wherever the
> page decides between the 3D sim section and its fallbacks; the hook itself
> must run only for non-mathematics subjects.

## Snippet (paste verbatim at the marker)

It assumes the server component already has `subjectSlug` (string) and
`topicId` (number) in scope; adapt the variable names to the page's locals:

```tsx
import { getModelForTopic } from "@/lib/models";
import { UploadedModelViewer } from "@/app/components/sims/UploadedModelViewer";
import { SimErrorBoundary } from "@/app/components/sims/SimErrorBoundary";

// …inside the page component, where the 3D section is decided:

{/* UPLOADED_MODEL_HOOK */}
{subjectSlug === "mathematics" ? null : await (async () => {
  const model = await getModelForTopic(topicId);
  if (!model) return null; // fall through to the existing sim logic below
  return (
    <SimErrorBoundary>
      <UploadedModelViewer url={model.url} />
    </SimErrorBoundary>
  );
})()}
```

## Rules

- `mathematics` subjects render nothing from this hook — they keep their
  existing behavior untouched.
- `getModelForTopic` returns `{ url } | null`; it only returns models whose
  status is `"ready"`, so failed/processing uploads never reach the page.
- When it returns `null`, the existing sim logic runs exactly as before —
  do not change any of that code, just fall through.
- The URL is a public-relative path like `/uploads/models/3/model.glb`,
  served statically from `public/`.
