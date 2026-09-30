// promote a registered user to admin (or check their status)
// Usage: npx tsx scripts/make-admin.ts user@email.com
// The operator must already be signed up — this script never creates users
// and never prints or handles passwords.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Usage: npx tsx scripts/make-admin.ts user@email.com");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `No user found with email "${email}". Ask them to sign up on the site first, then re-run.`
    );
    process.exitCode = 1;
    return;
  }
  if (user.role === "admin") {
    console.log(`"${email}" is already an admin. Nothing to do.`);
    return;
  }

  await prisma.user.update({ where: { email }, data: { role: "admin" } });
  console.log(`OK: "${email}" is now an admin.`);
}

main()
  .catch((e) => {
    console.error("Failed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
