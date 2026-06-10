"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { signInWithGitHub, signInWithGoogle } from "@/app/actions/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const providerButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = String(error.message).trim();
    if (message) {
      return message;
    }
  }

  return "Unknown sign-in error.";
}

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

async function openMobileOAuth(provider: "github" | "google") {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", "/discover");
  callbackUrl.searchParams.set("native", "1");

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: true,
      ...(provider === "google"
        ? {
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          }
        : {}),
    },
  });

  if (error || !data.url) {
    throw error ?? new Error("Supabase did not return a provider login URL.");
  }

  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: data.url });
  } catch (browserError) {
    console.warn("Capacitor Browser.open failed; falling back to window.open.", browserError);
    const opened = window.open(data.url, "_blank", "noopener,noreferrer");

    if (!opened) {
      window.location.assign(data.url);
    }
  }

  return true;
}

export function AuthProviderButtons() {
  const [isNative, setIsNative] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<"github" | "google" | null>(null);

  useEffect(() => {
    async function detectNativeRuntime() {
      const { Capacitor } = await import("@capacitor/core");
      setIsNative(Capacitor.isNativePlatform());
    }

    void detectNativeRuntime();
  }, []);

  function handleNativeSubmit(event: FormEvent<HTMLFormElement>, provider: "github" | "google") {
    event.preventDefault();
    setError(null);
    setPendingProvider(provider);
    void openMobileOAuth(provider)
      .catch((signInError) => {
        const message = getErrorMessage(signInError);
        console.error("Native OAuth start failed:", signInError);
        setError(`Sign-in could not start: ${message}`);
      })
      .finally(() => {
        setPendingProvider(null);
      });
  }

  return (
    <div className="space-y-3">
      <form action={signInWithGoogle} onSubmit={isNative ? (event) => handleNativeSubmit(event, "google") : undefined}>
        <button type="submit" className={providerButtonClass} disabled={pendingProvider !== null}>
          <GoogleIcon />
          <span>{pendingProvider === "google" ? "Opening Google..." : "Continue with Google"}</span>
        </button>
      </form>
      <form action={signInWithGitHub} onSubmit={isNative ? (event) => handleNativeSubmit(event, "github") : undefined}>
        <button type="submit" className={providerButtonClass} disabled={pendingProvider !== null}>
          <GitHubIcon />
          <span>{pendingProvider === "github" ? "Opening GitHub..." : "Continue with GitHub"}</span>
        </button>
      </form>
      {error ? <p className="text-center text-sm text-accent">{error}</p> : null}
    </div>
  );
}
