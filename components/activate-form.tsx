"use client";

import { useActionState } from "react";
import { activateUser } from "@/app/activate/actions";
import { EMPTY_FORM_STATE } from "@/lib/validation";

export function ActivateForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    activateUser,
    EMPTY_FORM_STATE,
  );
  const err = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={email}
          required
          className="input"
        />
        {err.email && <p className="field-error">{err.email}</p>}
      </div>

      <div>
        <label className="label" htmlFor="code">
          Activation code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          required
          autoFocus
          className="input tracking-[0.4em]"
        />
        {err.code && <p className="field-error">{err.code}</p>}
      </div>

      {state.message && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Activating…" : "Activate account"}
      </button>
    </form>
  );
}
