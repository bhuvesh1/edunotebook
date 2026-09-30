import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { CategoryForm } from "../CategoryForm";

export default async function NewCategoryPage() {
  await requirePermission("content");
  const subjects = await prisma.subject.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
  return (
    <CategoryForm
      heading="New category"
      subjects={subjects}
      initial={{
        name: "",
        slug: "",
        description: "",
        order: 0,
        subjectId: subjects[0]?.id ?? null,
      }}
    />
  );
}
