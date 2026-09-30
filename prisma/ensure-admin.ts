// prisma/ensure-admin.ts — idempotent admin bootstrap for production.
//
// Reads ADMIN_EMAIL + ADMIN_PASSWORD_HASH from the environment and upserts
// a user with role "admin". The password hash must be a bcrypt hash
// (created offline with the same bcryptjs version the app uses to verify);
// this script never sees or stores a plaintext password, and the runner
// image does not need bcryptjs installed.
//
// Run: tsx prisma/ensure-admin.ts   (after `prisma db push`)
// Safe to run on every boot: it only touches the one ADMIN_EMAIL row.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const passwordHash = (process.env.ADMIN_PASSWORD_HASH ?? "").trim();

  if (!email || !passwordHash) {
    console.log("[ensure-admin] ADMIN_EMAIL/ADMIN_PASSWORD_HASH not set — skipping.");
    return;
  }
  if (!passwordHash.startsWith("$2")) {
    console.error("[ensure-admin] refusing: ADMIN_PASSWORD_HASH is not a bcrypt hash.");
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "admin", isBanned: false },
    create: { email, name: "Administrator", passwordHash, role: "admin" },
  });
  console.log(`[ensure-admin] admin ready: ${user.email} (role=${user.role})`);
}

main()
  .catch((e) => {
    console.error("[ensure-admin] failed:", e?.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
