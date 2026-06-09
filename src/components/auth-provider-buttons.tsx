"use client";

import { signInWithGitHub, signInWithGoogle } from "@/app/actions/auth";

const providerButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

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

export function AuthProviderButtons() {
  return (
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
  );
}
