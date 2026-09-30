import { redirect } from "next/navigation";
import { auth } from "@/auth";
import PanelNav from "./PanelNav";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Belt-and-suspenders: proxy.ts already redirects logged-out users.
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/panel");

  return (
    <div>
      <h2 className="notebook-underline mb-6 inline-block pb-2 text-3xl font-bold sm:text-4xl">
        Your panel
      </h2>
      <div className="md:flex md:gap-8">
        <PanelNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
