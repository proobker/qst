"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { deleteAccountAction, type DeleteAccountState } from "@/app/actions/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: DeleteAccountState = {
  message: "",
};

export function DeleteAccountSection({ email }: { email: string }) {
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [state, formAction, pending] = useActionState(deleteAccountAction, initialState);
  const normalizedEmail = email.trim().toLowerCase();
  const canSubmit = normalizedEmail.length > 0 && confirmationEmail.trim().toLowerCase() === normalizedEmail;

  return (
    <Card variant="danger" className="p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-danger/40 bg-danger/15 p-2 text-red-200">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-red-100">Delete account</h2>
          <p className="mt-2 text-sm leading-6 text-red-100/80">
            This permanently deletes {email}, including profile data, quests, posts, votes, friendships, badges, and
            proof uploads. This cannot be undone.
          </p>

          <form action={formAction} className="mt-4 space-y-3">
            <label htmlFor="delete-account-confirmation-email" className="block space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-red-100/80">Confirm email</span>
              <Input
                id="delete-account-confirmation-email"
                name="confirmationEmail"
                type="email"
                value={confirmationEmail}
                onChange={(event) => setConfirmationEmail(event.target.value)}
                autoComplete="email"
                placeholder={email}
                required
                className="border-danger/40 font-semibold focus:border-danger sm:max-w-xs"
              />
            </label>

            {state.message ? (
              <p
                className="rounded-lg border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-red-100"
                aria-live="polite"
              >
                {state.message}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="danger"
              disabled={!canSubmit || pending}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              <span>{pending ? "Deleting..." : "Delete account"}</span>
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
