// app/admin/page.tsx — admin dashboard: real counts from the DB + quick actions.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { effectiveSim } from "@/lib/simulations/registry";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, matches QuizAttempt.date
}

function Card({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1 font-hand text-4xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </>
  );
  const cls =
    "rounded-xl border-2 border-[var(--rule)] bg-white/80 p-4 shadow-sm";
  return href ? (
    <Link href={href} className={`${cls} block hover:border-[var(--margin-line)]`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="notebook-underline mb-4 inline-block pb-1 text-xl font-bold">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

export default async function AdminDashboard() {
  await requirePermission("dashboard"); // layout already gated; re-check for the dashboard data load

  const [
    subjectCount,
    categoryCount,
    topicCount,
    publishedTopics,
    blogPublished,
    blogDraft,
    userTotal,
    bannedTotal,
    quizTotal,
    quizToday,
    suggestionsNew,
    questionsAsked,
    topicsForSim,
  ] = await Promise.all([
    prisma.subject.count(),
    prisma.category.count(),
    prisma.topic.count(),
    prisma.topic.count({ where: { status: "published" } }),
    prisma.blogPost.count({ where: { status: "published" } }),
    prisma.blogPost.count({ where: { status: "draft" } }),
    prisma.user.count(),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.quizAttempt.count(),
    prisma.quizAttempt.count({ where: { date: todayStr() } }),
    prisma.suggestion.count({ where: { status: "new" } }),
    prisma.askedQuestion.count(),
    prisma.topic.findMany({ select: { name: true, simKey: true } }),
  ]);

  const topicsWith3d = topicsForSim.filter(
    (t) => effectiveSim(t.name, t.simKey) !== null
  ).length;

  const fmt = (n: number) => n.toLocaleString("en-IN");

  return (
    <div>
      <h1 className="font-hand text-3xl font-bold sm:text-4xl">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Live numbers straight from the database.
      </p>

      <Section title="Academic content">
        <Card label="Subjects" value={fmt(subjectCount)} href="/admin/subjects" />
        <Card label="Categories" value={fmt(categoryCount)} href="/admin/categories" />
        <Card label="Topics" value={fmt(topicCount)} href="/admin/topics" />
        <Card
          label="Published topics"
          value={fmt(publishedTopics)}
          sub={`${fmt(topicCount - publishedTopics)} drafts`}
        />
        <Card
          label="Topics with 3D"
          value={fmt(topicsWith3d)}
          sub={`${fmt(topicCount - topicsWith3d)} without a sim`}
        />
      </Section>

      <Section title="Blogs">
        <Card label="Published" value={fmt(blogPublished)} href="/admin/blogs" />
        <Card label="Drafts" value={fmt(blogDraft)} href="/admin/blogs?status=draft" />
      </Section>

      <Section title="Users & activity">
        <Card
          label="Users"
          value={fmt(userTotal)}
          sub={bannedTotal > 0 ? `${fmt(bannedTotal)} banned` : undefined}
          href="/admin/users"
        />
        <Card label="Quiz attempts" value={fmt(quizTotal)} sub={`${fmt(quizToday)} today`} />
        <Card label="New suggestions" value={fmt(suggestionsNew)} href="/admin/suggestions" />
        <Card label="Questions asked" value={fmt(questionsAsked)} href="/admin/questions" />
      </Section>

      <Section title="Quick actions">
        <Link
          href="/admin/subjects/new"
          className="rounded-xl border-2 border-dashed border-[var(--rule)] bg-white/60 p-4 text-center font-bold hover:border-[var(--margin-line)]"
        >
          ＋ New subject
        </Link>
        <Link
          href="/admin/topics/new"
          className="rounded-xl border-2 border-dashed border-[var(--rule)] bg-white/60 p-4 text-center font-bold hover:border-[var(--margin-line)]"
        >
          ＋ New topic
        </Link>
        <Link
          href="/admin/suggestions"
          className="rounded-xl border-2 border-dashed border-[var(--rule)] bg-white/60 p-4 text-center font-bold hover:border-[var(--margin-line)]"
        >
          ✉ Review suggestions
        </Link>
      </Section>
    </div>
  );
}
