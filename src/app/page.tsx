import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthProviderButtons } from "@/components/auth-provider-buttons";
import { EmailCodeSignInForm } from "@/components/email-code-sign-in-form";
import { Logo } from "@/components/logo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type HomeProps = {
  searchParams?: Promise<{
    account?: string | string[];
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

const accountMessages: Record<string, { tone: "success" | "error"; text: string }> = {
  deleted: {
    tone: "success",
    text: "Your qst account has been deleted.",
  },
};

function getAuthMessage(auth: string | string[] | undefined) {
  const value = Array.isArray(auth) ? auth[0] : auth;
  return value ? authMessages[value] : undefined;
}

function getAccountMessage(account: string | string[] | undefined) {
  const value = Array.isArray(account) ? account[0] : account;
  return value ? accountMessages[value] : undefined;
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
  const accountMessage = getAccountMessage(params?.account);
  const statusMessage = accountMessage ?? authMessage;

  return (
    <div className="flex min-h-[100svh] items-start justify-center overflow-y-auto bg-background px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:min-h-screen sm:items-center sm:px-4 sm:py-12">
      <main className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-xl shadow-primary/10 sm:space-y-6 sm:p-8">
        <header className="flex flex-col items-center gap-3 text-center sm:gap-4">
          <Logo size="md" />
          <p className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[0.68rem] font-medium uppercase tracking-wide text-primary sm:text-xs">
            real life adventure game
          </p>
        </header>
        <p className="text-center text-sm leading-6 text-muted sm:text-base sm:leading-relaxed">
          Turn real life into an RPG. Discover AI-generated side quests based on your hobbies and location, complete
          them, post proof, collect approvals, and level up with badges.
        </p>
        {statusMessage ? (
          <p
            className={`rounded-lg border px-3 py-2 text-center text-sm sm:px-4 sm:py-3 ${
              statusMessage.tone === "success"
                ? "border-success/40 bg-success/10 text-success"
                : "border-accent/40 bg-accent/10 text-accent"
            }`}
          >
            {statusMessage.text}
          </p>
        ) : null}
        <AuthProviderButtons />
        <div className="flex items-center gap-3 text-xs font-semibold text-muted sm:text-sm">
          <span className="h-px flex-1 bg-border" />
          <span>OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <EmailCodeSignInForm />
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
