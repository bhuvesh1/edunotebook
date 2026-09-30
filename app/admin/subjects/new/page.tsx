import { SubjectForm } from "../SubjectForm";
import { requirePermission } from "@/lib/admin";

export default async function NewSubjectPage() {
  await requirePermission("content");
  return (
    <SubjectForm
      heading="New subject"
      initial={{
        name: "",
        slug: "",
        description: "",
        icon: "",
        order: 0,
        enabled: true,
      }}
    />
  );
}
