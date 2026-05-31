import { redirect } from "next/navigation";
import { signInWithGoogle } from "@/app/actions/auth";
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
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <main className="w-full max-w-2xl space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="inline-flex rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-600">
          real life adventure game
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">qst</h1>
        <p className="text-base leading-relaxed text-zinc-700">
          Turn real life into an RPG. Discover AI-generated side quests based on your hobbies and location, complete
          them, post proof, collect approvals, and level up with badges.
        </p>
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Continue with Google
          </button>
        </form>
      </main>
    </div>
  );
}
