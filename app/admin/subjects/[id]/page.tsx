import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { SubjectForm } from "../SubjectForm";

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("content");
  const { id } = await params;
  const s = await prisma.subject.findUnique({ where: { id: Number(id) } });
  if (!s) notFound();

  return (
    <SubjectForm
      heading={`Edit subject — ${s.name}`}
      initial={{
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description ?? "",
        icon: s.icon ?? "",
        order: s.order,
        enabled: s.enabled,
      }}
    />
  );
}
