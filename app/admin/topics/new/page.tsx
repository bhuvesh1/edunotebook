import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin";
import { TopicNewForm, type TaxonomyTree } from "../TopicNewForm";

export default async function NewTopicPage() {
  await requirePermission("content");
  const subjects = await prisma.subject.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      categories: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          subcategories: {
            orderBy: { id: "asc" },
            select: { id: true, name: true },
          },
        },
      },
    },
  });
  const tree: TaxonomyTree[] = subjects;
  return <TopicNewForm tree={tree} />;
}
