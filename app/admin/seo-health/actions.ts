// app/admin/seo-health/actions.ts — SEO Health scan + issue fixes, admin-gated.
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import type { AdminSessionUser } from "@/lib/admin";
import { auditLog } from "@/lib/audit";
import { runSeoScan } from "@/lib/seo/scan";
import { buildBlogPost, assembleContentHtml } from "@/lib/blogs/generator";
import type { ActionState } from "../ui";

/** Section gate for the SEO area (admin + seo-manager roles). */
export async function requireSeo(): Promise<AdminSessionUser> {
  return requirePermission("seo");
}

const ok: ActionState = { error: null };

/** Run a full SEO scan; new findings become open SeoIssue rows. */
export async function rescanAction(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const admin = await requireSeo();
  const counts = await runSeoScan();
  await auditLog("seo.scan", {
    actorId: admin.id,
    actorEmail: admin.email,
    detail: counts,
  });
  revalidatePath("/admin/seo-health");
  return ok;
}

/** Fix an issue according to its kind (orphan + missing-meta are auto-fixable). */
export async function fixAction(
  id: number,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const admin = await requireSeo();
  const issue = await prisma.seoIssue.findUnique({ where: { id } });
  if (!issue) return { error: "Issue not found." };

  switch (issue.kind) {
    case "orphan": {
      const parts = (issue.ref ?? "").split("/");
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return { error: "Cannot parse topic reference for this issue." };
      }
      const [subjectSlug, topicSlug] = parts;
      const topic = await prisma.topic.findFirst({
        where: {
          slug: topicSlug,
          status: "published",
          subcategory: { category: { subject: { slug: subjectSlug } } },
        },
        include: {
          subcategory: {
            select: {
              name: true,
              category: {
                select: {
                  name: true,
                  subject: { select: { slug: true, name: true } },
                },
              },
            },
          },
        },
      });
      if (!topic) return { error: "Topic not found — it may have been deleted." };
      const existing = await prisma.blogPost.findUnique({
        where: { topicId: topic.id },
        select: { id: true },
      });
      if (existing) {
        await prisma.seoIssue.update({ where: { id }, data: { status: "fixed" } });
        break;
      }
      const baseSlug = `${subjectSlug}-${topicSlug}`;
      let blogSlug = baseSlug;
      if (await prisma.blogPost.findUnique({ where: { slug: blogSlug }, select: { id: true } })) {
        blogSlug = `${baseSlug}-seo-${id}`;
      }
      const siblings = await prisma.topic.findMany({
        where: {
          subcategoryId: topic.subcategoryId,
          blogPost: { isNot: null },
        },
        select: {
          name: true,
          blogPost: { select: { slug: true } },
        },
      });
      const siblingRefs = siblings.flatMap((s) =>
        s.blogPost && s.blogPost.slug !== blogSlug
          ? [{ name: s.name, slug: s.blogPost.slug }]
          : []
      );
      const built = await buildBlogPost({
        slug: blogSlug,
        topicId: topic.id,
        subject: topic.subcategory.category.subject.name,
        subjectSlug,
        category: topic.subcategory.category.name,
        subcategory: topic.subcategory.name,
        topic: topic.name,
        topicSlug,
        siblings: siblingRefs,
      });
      await prisma.blogPost.create({
        data: {
          slug: built.slug,
          title: built.title,
          excerpt: built.excerpt,
          summary: built.summary,
          contentHtml: assembleContentHtml(built),
          subjectSlug,
          topicSlug,
          status: "draft",
          source: "seo-fix",
          topicId: topic.id,
        },
      });
      await prisma.seoIssue.update({ where: { id }, data: { status: "fixed" } });
      await auditLog("seo.issue-fix", {
        actorId: admin.id,
        actorEmail: admin.email,
        entityType: "SeoIssue",
        entityId: id,
        detail: { kind: "orphan", createdDraft: blogSlug },
      });
      revalidatePath("/admin/seo-health");
      return ok;
    }
    case "missing-meta": {
      const blog = await prisma.blogPost.findUnique({
        where: { slug: issue.ref ?? "" },
        select: { id: true, title: true, summary: true },
      });
      if (!blog) return { error: "Blog post not found — it may have been deleted." };
      await prisma.blogPost.update({
        where: { id: blog.id },
        data: {
          excerpt: blog.summary?.slice(0, 150) || `${blog.title} — complete study guide.`,
        },
      });
      await prisma.seoIssue.update({ where: { id }, data: { status: "fixed" } });
      await auditLog("seo.issue-fix", {
        actorId: admin.id,
        actorEmail: admin.email,
        entityType: "SeoIssue",
        entityId: id,
        detail: { kind: "missing-meta" },
      });
      revalidatePath("/admin/seo-health");
      return ok;
    }
    case "duplicate":
      return { error: "Edit one of the blogs to differentiate titles." };
    case "broken-link":
      return { error: "Fix the link in the blog editor." };
    default:
      return { error: `No auto-fix available for issue kind "${issue.kind}".` };
  }

  // orphan already-blogged path lands here (marked fixed above)
  revalidatePath("/admin/seo-health");
  return ok;
}

/** Dismiss an issue without fixing it. */
export async function ignoreAction(
  id: number,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const admin = await requireSeo();
  await prisma.seoIssue.update({ where: { id }, data: { status: "ignored" } });
  await auditLog("seo.issue-ignore", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "SeoIssue",
    entityId: id,
  });
  revalidatePath("/admin/seo-health");
  return ok;
}

/** Re-open an ignored or fixed issue. */
export async function reopenAction(
  id: number,
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const admin = await requireSeo();
  await prisma.seoIssue.update({ where: { id }, data: { status: "open" } });
  await auditLog("seo.issue-ignore", {
    actorId: admin.id,
    actorEmail: admin.email,
    entityType: "SeoIssue",
    entityId: id,
    detail: { reopened: true },
  });
  revalidatePath("/admin/seo-health");
  return ok;
}
