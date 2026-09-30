import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { CategoryForm } from "../CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("content");
  const { id } = await params;
  const [c, subjects] = await Promise.all([
    prisma.category.findUnique({ where: { id: Number(id) } }),
    prisma.subject.findMany({
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  if (!c) notFound();

  return (
    <CategoryForm
      heading={`Edit category — ${c.name}`}
      subjects={subjects}
      initial={{
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? "",
        order: c.order,
        subjectId: c.subjectId,
      }}
    />
  );
}
