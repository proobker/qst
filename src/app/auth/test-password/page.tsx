import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TestPasswordSignInForm } from "./test-password-form";

export const metadata: Metadata = {
  title: "Test sign in | qst",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TestPasswordSignInPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/discover");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <main className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-primary/10 sm:p-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <Logo size="lg" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Test sign in</h1>
            <p className="text-sm leading-6 text-muted">Admin and testing access.</p>
          </div>
        </header>
        <TestPasswordSignInForm />
      </main>
    </div>
  );
}
