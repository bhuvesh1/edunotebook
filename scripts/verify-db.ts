// Verify the seeded database: 7 subjects, 3531 topics total.
// Run: npx tsx scripts/verify-db.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const subjects = await prisma.subject.findMany({
    include: {
      categories: {
        include: {
          subcategories: { include: { _count: { select: { topics: true } } } },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  let total = 0;
  for (const s of subjects) {
    const count = s.categories.reduce(
      (a, c) =>
        a + c.subcategories.reduce((x, sc) => x + sc._count.topics, 0),
      0
    );
    total += count;
    console.log(`${s.name} (${s.slug}): ${count} topics`);
  }
  console.log(`\nSubjects: ${subjects.length} (expected 7)`);
  console.log(`Topics: ${total} (expected 3531)`);
  if (subjects.length !== 7 || total !== 3531) {
    console.error("MISMATCH!");
    process.exit(1);
  }
  console.log("OK — counts match.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
