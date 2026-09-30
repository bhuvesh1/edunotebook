// GET /api/session — lightweight session check for client components
// (e.g. BookmarkButton). Returns the logged-in user or null; never throws.
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
  });
}
