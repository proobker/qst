"use client";

import { useActionState } from "react";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { signInWithEmailCode, type EmailSignInState } from "@/app/actions/auth";

const initialState: EmailSignInState = {
  step: "email",
  email: "",
  message: "",
  tone: null,
};

function SubmitText({ step, pending }: { step: EmailSignInState["step"]; pending: boolean }) {
  if (pending) {
    return step === "code" ? "Checking..." : "Sending...";
  }

  return step === "code" ? "Verify code" : "Continue";
}

export function EmailCodeSignInForm() {
  const [state, formAction, pending] = useActionState(signInWithEmailCode, initialState);
  const isCodeStep = state.step === "code";

  return (
    <form action={formAction} className="space-y-3 sm:space-y-4">
      <input type="hidden" name="intent" value={isCodeStep ? "verify" : "send"} />
      {isCodeStep ? <input type="hidden" name="email" value={state.email} /> : null}

      {isCodeStep ? (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
            <span className="min-w-0 truncate text-sm font-medium text-muted">{state.email}</span>
            <button
              type="submit"
              name="intent"
              value="send"
              className="inline-flex shrink-0 items-center justify-center rounded-md p-2 text-muted transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              title="Resend code"
              aria-label="Resend code"
            >
              <Mail aria-hidden="true" className="size-4" strokeWidth={2.2} />
            </button>
          </div>
          <label className="relative block">
            <span className="sr-only">Email code</span>
            <KeyRound
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
              strokeWidth={2.2}
            />
            <input
              type="text"
              name="code"
              placeholder="6-digit code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              required
              className="h-11 w-full rounded-lg border border-border bg-background px-4 pl-12 text-sm font-medium text-foreground outline-none transition placeholder:text-muted hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/30 sm:h-12"
            />
          </label>
        </div>
      ) : (
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
            defaultValue={state.email}
            required
            className="h-11 w-full rounded-lg border border-border bg-background px-4 pl-12 text-sm font-medium text-foreground outline-none transition placeholder:text-muted hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/30 sm:h-12"
          />
        </label>
      )}

      {state.message ? (
        <p
          className={`rounded-lg border px-3 py-2 text-center text-sm sm:px-4 sm:py-3 ${
            state.tone === "success"
              ? "border-success/40 bg-success/10 text-success"
              : "border-accent/40 bg-accent/10 text-accent"
          }`}
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        {isCodeStep ? (
          <button
            type="submit"
            name="intent"
            value="back"
            className="inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
            disabled={pending}
            title="Use another email"
            aria-label="Use another email"
          >
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={2.2} />
          </button>
        ) : null}
        <button
          type="submit"
          className="inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70 sm:h-12"
          disabled={pending}
        >
          <SubmitText step={state.step} pending={pending} />
        </button>
      </div>
    </form>
  );
}
