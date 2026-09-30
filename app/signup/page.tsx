import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuthForm from "../components/AuthForm";
import { signupAction } from "./actions";

export const metadata = { title: "Sign up" };

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect("/panel/profile");

  return (
    <div className="mx-auto max-w-md">
      <h2 className="notebook-underline inline-block pb-2 text-3xl font-bold sm:text-4xl">
        Create an account
      </h2>
      <p className="mt-3 text-slate-600">
        One account unlocks Ask Me Anything, the daily quiz, suggestions,
        reading stats and bookmarks.
      </p>
      <AuthForm action={signupAction} mode="signup" />
    </div>
  );
}
