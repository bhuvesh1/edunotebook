import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { SITE_NAME } from "../lib/site";
import { getSubjectsFromDB } from "../lib/content";
import enMessages from "../messages/en.json";
import SubjectNav from "./components/SubjectNav";
import HeaderAuth from "./components/HeaderAuth";
import LanguageSwitcher from "../components/LanguageSwitcher";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: (enMessages.site as { tagline: string }).tagline,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This nav is rendered by the ROOT layout, so it appears on EVERY page and
  // never changes when a subject is clicked — only page content below changes.
  const subjects = (await getSubjectsFromDB()).map((s) => ({
    name: s.name,
    slug: s.slug,
  }));

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <header className="pt-8 pb-4 px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-wide notebook-underline inline-block pb-1">
              {SITE_NAME}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 italic">
              {(enMessages.site as { tagline: string }).tagline}
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <HeaderAuth />
              <LanguageSwitcher />
            </div>
          </header>

          <SubjectNav subjects={subjects} />

          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </main>

          <footer className="border-t border-[var(--rule)] py-4 px-4 text-center text-sm text-slate-500">
            {SITE_NAME} —{" "}
            {(enMessages.site as { footerNote: string }).footerNote}
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
