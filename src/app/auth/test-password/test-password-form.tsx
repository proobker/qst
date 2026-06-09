"use client";

import { LockKeyhole } from "lucide-react";
import { useActionState } from "react";
import { signInWithTestPassword, type TestPasswordSignInState } from "@/app/actions/auth";

const initialState: TestPasswordSignInState = {
  message: "",
};

export function TestPasswordSignInForm() {
  const [state, formAction, pending] = useActionState(signInWithTestPassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-foreground">Email or user ID</span>
        <input
          type="text"
          name="identifier"
          autoComplete="username"
          required
          className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-foreground">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </label>
      {state.message ? (
        <p className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent" aria-live="polite">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LockKeyhole aria-hidden="true" className="size-5" strokeWidth={2.2} />
        <span>{pending ? "Signing in..." : "Sign in"}</span>
      </button>
    </form>
  );
}
