import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuthForm from "../components/AuthForm";
import { loginAction } from "./actions";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) redirect("/panel/profile");

  const { callbackUrl } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <h2 className="notebook-underline inline-block pb-2 text-3xl font-bold sm:text-4xl">
        Log in
      </h2>
      <p className="mt-3 text-slate-600">
        Log in to ask questions, take the daily quiz, and keep bookmarks.
        The rest of the site works fine without an account.
      </p>
      <AuthForm action={loginAction} mode="login" callbackUrl={callbackUrl} />
    </div>
  );
}
