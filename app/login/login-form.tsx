"use client";

import { useActionState } from "react";
import {
  authenticate,
  signInWithGoogle,
  signInWithMicrosoft,
} from "./actions";

export function LoginForm({
  providers,
}: {
  providers: { google: boolean; microsoft: boolean };
}) {
  const [error, formAction, pending] = useActionState(authenticate, undefined);
  const anySocial = providers.google || providers.microsoft;

  return (
    <div className="space-y-4">
      {anySocial && (
        <div className="space-y-2">
          {providers.google && (
            <form action={signInWithGoogle}>
              <button type="submit" className="btn-secondary w-full">
                <GoogleIcon />
                Continue with Google
              </button>
            </form>
          )}
          {providers.microsoft && (
            <form action={signInWithMicrosoft}>
              <button type="submit" className="btn-secondary w-full">
                <MicrosoftIcon />
                Continue with Microsoft
              </button>
            </form>
          )}
          <div className="flex items-center gap-3 py-1 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="username">
            Username or email
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 009 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72a5.4 5.4 0 010-3.44V4.94H.96a9 9 0 000 8.12l3.02-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 00.96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
      <path fill="#F25022" d="M0 0h8.5v8.5H0z" />
      <path fill="#7FBA00" d="M9.5 0H18v8.5H9.5z" />
      <path fill="#00A4EF" d="M0 9.5h8.5V18H0z" />
      <path fill="#FFB900" d="M9.5 9.5H18V18H9.5z" />
    </svg>
  );
}
