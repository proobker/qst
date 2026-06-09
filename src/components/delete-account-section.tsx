"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { deleteAccountAction, type DeleteAccountState } from "@/app/actions/auth";

const initialState: DeleteAccountState = {
  message: "",
};

export function DeleteAccountSection({ email }: { email: string }) {
  const [confirmation, setConfirmation] = useState("");
  const [state, formAction, pending] = useActionState(deleteAccountAction, initialState);
  const canSubmit = confirmation === "DELETE";

  return (
    <section className="rounded-xl border border-red-500/40 bg-red-500/10 p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-red-400/40 bg-red-500/15 p-2 text-red-200">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-red-100">Delete account</h2>
          <p className="mt-2 text-sm leading-6 text-red-100/80">
            This permanently deletes {email}, including profile data, quests, posts, votes, friendships, badges, and
            proof uploads. This cannot be undone.
          </p>

          <form action={formAction} className="mt-4 space-y-3">
            <label htmlFor="delete-account-confirmation" className="block space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-red-100/80">Type DELETE</span>
              <input
                id="delete-account-confirmation"
                name="confirmation"
                type="text"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-red-400/40 bg-background px-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted focus:border-red-300 focus:ring-2 focus:ring-red-400/30 sm:max-w-xs"
              />
            </label>

            {state.message ? (
              <p
                className="rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-100"
                aria-live="polite"
              >
                {state.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit || pending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              <span>{pending ? "Deleting..." : "Delete account"}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
