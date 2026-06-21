"use client";

import { useActionState } from "react";
import { registerUser } from "@/app/register/actions";
import { EMPTY_FORM_STATE } from "@/lib/validation";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerUser,
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
          required
          autoFocus
          className="input"
        />
        {err.email && <p className="field-error">{err.email}</p>}
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="input"
        />
        {err.password ? (
          <p className="field-error">{err.password}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
        )}
      </div>

      {state.message && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
