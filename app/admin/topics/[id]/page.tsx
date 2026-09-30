import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { TopicEditForm } from "../TopicEditForm";

export default async function EditTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("content");
  const { id } = await params;
  const t = await prisma.topic.findUnique({
    where: { id: Number(id) },
    include: {
      subcategory: {
        select: {
          name: true,
          category: {
            select: { name: true, subject: { select: { name: true } } },
          },
        },
      },
    },
  });
  if (!t) notFound();

  return (
    <TopicEditForm
      initial={{
        id: t.id,
        name: t.name,
        slug: t.slug,
        description: t.description ?? "",
        status: t.status,
        simKey: t.simKey,
        placement: `${t.subcategory.category.subject.name} / ${t.subcategory.category.name} / ${t.subcategory.name}`,
      }}
    />
  );
}
