import { getLocale } from "../lib/i18n";

/**
 * Honest fallback banner for Hindi readers on pages whose BODY content is
 * still English-only (topic pages, blog posts). Chrome/UI around the body
 * may be translated, but we never machine-translate the content itself —
 * so we say so plainly instead of pretending.
 *
 * Renders nothing when the active locale is English.
 */
export default async function HindiFallbackNotice() {
  const locale = await getLocale();
  if (locale !== "hi") return null;

  return (
    <div
      role="note"
      className="mb-6 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm"
    >
      <p className="font-semibold">
        हिन्दी अनुवाद जल्द आ रहा है — अभी अंग्रेज़ी में दिखाया जा रहा है।
      </p>
      <p className="mt-1 text-sm text-amber-800">
        Hindi translation coming soon — showing English for now.
      </p>
    </div>
  );
}
