import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

// Cache the topic index in memory (3,531 rows — light).
// Rebuilt on each server start; topics rarely change.
let indexCache: {
  id: number;
  name: string;
  lower: string;
  url: string;
  subject: string;
  category: string;
}[] | null = null;

async function getIndex() {
  if (indexCache) return indexCache;
  const topics = await prisma.topic.findMany({
    where: { status: "published" },
    select: {
      id: true,
      name: true,
      slug: true,
      subcategory: {
        select: {
          category: {
            select: {
              name: true,
              subject: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  });
  indexCache = topics.map((t) => ({
    id: t.id,
    name: t.name,
    lower: t.name.toLowerCase(),
    url: `/topic/${t.subcategory.category.subject.slug}/${t.slug}`,
    subject: t.subcategory.category.subject.name,
    category: t.subcategory.category.name,
  }));
  return indexCache;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const index = await getIndex();
  const words = q.split(/\s+/);
  const results = index
    .filter((t) => words.every((w) => t.lower.includes(w)))
    .slice(0, 12)
    .map(({ lower, ...rest }) => rest);

  return NextResponse.json({ results });
}
