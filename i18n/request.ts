// next-intl v4 request config. Single locale for Phase 1 ("en") —
// more locales can be added here in Phase 2 without touching layouts.
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "en";
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
