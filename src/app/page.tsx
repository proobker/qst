import { redirect } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { signInWithEmail } from "@/app/actions/auth";
import { AuthProviderButtons } from "@/components/auth-provider-buttons";
import { Logo } from "@/components/logo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type HomeProps = {
  searchParams?: Promise<{
    auth?: string | string[];
  }>;
};

const authMessages: Record<string, { tone: "success" | "error"; text: string }> = {
  "check-email": {
    tone: "success",
    text: "Check your email for a qst sign-in link.",
  },
  "email-error": {
    tone: "error",
    text: "We could not send that sign-in link. Try again in a moment.",
  },
  "invalid-email": {
    tone: "error",
    text: "Enter a complete email address to continue.",
  },
  "oauth-error": {
    tone: "error",
    text: "We could not start that sign-in flow. Try again in a moment.",
  },
};

function getAuthMessage(auth: string | string[] | undefined) {
  const value = Array.isArray(auth) ? auth[0] : auth;
  return value ? authMessages[value] : undefined;
}

export default async function Home({ searchParams }: HomeProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/discover");
  }

  const params = searchParams ? await searchParams : undefined;
  const authMessage = getAuthMessage(params?.auth);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <main className="w-full max-w-lg space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-primary/10 sm:p-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <Logo size="lg" />
          <p className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
            real life adventure game
          </p>
        </header>
        <p className="text-center text-base leading-relaxed text-muted">
          Turn real life into an RPG. Discover AI-generated side quests based on your hobbies and location, complete
          them, post proof, collect approvals, and level up with badges.
        </p>
        {authMessage ? (
          <p
            className={`rounded-lg border px-4 py-3 text-center text-sm ${
              authMessage.tone === "success"
                ? "border-success/40 bg-success/10 text-success"
                : "border-accent/40 bg-accent/10 text-accent"
            }`}
          >
            {authMessage.text}
          </p>
        ) : null}
        <AuthProviderButtons />
        <div className="flex items-center gap-3 text-sm font-semibold text-muted">
          <span className="h-px flex-1 bg-border" />
          <span>OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <form action={signInWithEmail} className="space-y-4">
          <label className="relative block">
            <span className="sr-only">Email</span>
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
              strokeWidth={2.2}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              required
              className="h-12 w-full rounded-lg border border-border bg-background px-4 pl-12 text-sm font-medium text-foreground outline-none transition placeholder:text-muted hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Continue
          </button>
        </form>
        <p className="text-center text-xs leading-5 text-muted">
          By continuing, you agree to qst&apos;s{" "}
          <Link href="/privacy" className="font-semibold text-primary transition hover:text-primary-hover">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
