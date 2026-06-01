import { redirect } from "next/navigation";
import { signInWithGoogle } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/discover");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <main className="w-full max-w-2xl space-y-6 rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-primary/10">
        <p className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          real life adventure game
        </p>
        <Logo size="lg" className="justify-center" />
        <p className="text-base leading-relaxed text-muted">
          Turn real life into an RPG. Discover AI-generated side quests based on your hobbies and location, complete
          them, post proof, collect approvals, and level up with badges.
        </p>
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Continue with Google
          </button>
        </form>
      </main>
    </div>
  );
}
