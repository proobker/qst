import { redirect } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { signInWithEmail, signInWithGitHub, signInWithGoogle } from "@/app/actions/auth";
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

function GoogleIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-5 items-center justify-center text-xl font-bold leading-none text-foreground"
    >
      G
    </span>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" className="size-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.69.5.1.68-.22.68-.5v-1.91c-2.78.62-3.36-1.2-3.36-1.2-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.71 0 0 .84-.28 2.75 1.05A9.31 9.31 0 0 1 12 6.92c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.4.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.95.68 1.92v2.8c0 .28.18.6.69.5A10.08 10.08 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function getAuthMessage(auth: string | string[] | undefined) {
  const value = Array.isArray(auth) ? auth[0] : auth;
  return value ? authMessages[value] : undefined;
}

const providerButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

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
        <div className="space-y-3">
          <form action={signInWithGoogle}>
            <button type="submit" className={providerButtonClass}>
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
          </form>
          <form action={signInWithGitHub}>
            <button type="submit" className={providerButtonClass}>
              <GitHubIcon />
              <span>Continue with GitHub</span>
            </button>
          </form>
        </div>
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
