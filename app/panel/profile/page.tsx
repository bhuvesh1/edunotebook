import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { updateNameAction, signOutAction } from "./actions";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: Number(session.user.id) },
        select: { name: true, email: true, createdAt: true },
      })
    : null;

  return (
    <div>
      <h3 className="notebook-underline inline-block pb-1 text-2xl font-bold sm:text-3xl">
        Profile
      </h3>

      <div className="mt-5 max-w-md rounded-2xl border-2 border-[var(--rule)] bg-white/70 p-5">
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {user?.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Member since
            </dt>
            <dd className="mt-0.5 text-slate-700">
              {user?.createdAt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }) ?? "—"}
            </dd>
          </div>
        </dl>

        <form action={updateNameAction} className="mt-5 border-t border-[var(--rule)] pt-5">
          <label
            htmlFor="profile-name"
            className="font-hand text-lg font-semibold text-slate-800"
          >
            Display name
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="profile-name"
              name="name"
              type="text"
              defaultValue={user?.name ?? ""}
              maxLength={80}
              required
              className="min-w-0 flex-1 rounded-lg border-2 border-[var(--rule)] bg-white px-4 py-2 text-slate-800 focus:border-[var(--margin-line)] focus:outline-none"
            />
            <button
              type="submit"
              className="font-hand shrink-0 rounded-lg bg-slate-800 px-4 py-2 text-lg font-bold text-white hover:bg-slate-700"
            >
              Save
            </button>
          </div>
        </form>

        <form action={signOutAction} className="mt-5">
          <button
            type="submit"
            className="font-hand w-full rounded-lg border-2 border-red-300 px-4 py-2 text-lg font-bold text-red-700 hover:bg-red-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
