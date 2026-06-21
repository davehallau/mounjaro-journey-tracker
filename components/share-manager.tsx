"use client";

import { useActionState } from "react";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/validation";
import type { ShareRow } from "@/lib/shares";

type ShareAction = (state: FormState, formData: FormData) => Promise<FormState>;
type RevokeAction = (formData: FormData) => void | Promise<void>;

const FIELD_TOGGLES = [
  { name: "share_dob", label: "DOB" },
  { name: "share_mood", label: "Mood" },
  { name: "share_appetite", label: "Appetite" },
  { name: "share_energy", label: "Energy" },
  { name: "share_notes", label: "Notes" },
];

function sharedSummary(flags: ShareRow["flags"]): string {
  const optional = [
    flags.dob && "DOB",
    flags.mood && "mood",
    flags.appetite && "appetite",
    flags.energy && "energy",
    flags.notes && "notes",
  ].filter(Boolean) as string[];
  return ["weight", "waist", "BMI", "medication", ...optional].join(", ");
}

export function ShareManager({
  shareAction,
  revokeAction,
  shares,
}: {
  shareAction: ShareAction;
  revokeAction: RevokeAction;
  shares: ShareRow[];
}) {
  const [state, formAction, pending] = useActionState(
    shareAction,
    EMPTY_FORM_STATE,
  );
  const err = state.errors ?? {};

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-3">
        <div>
          <label className="label" htmlFor="share-email">
            Recipient email
          </label>
          <input
            id="share-email"
            name="email"
            type="email"
            inputMode="email"
            placeholder="them@example.com"
            className="input"
          />
          {err.email && <p className="field-error">{err.email}</p>}
        </div>

        <div>
          <p className="label">Optional fields to include</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {FIELD_TOGGLES.map((f) => (
              <label
                key={f.name}
                className="inline-flex items-center gap-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  name={f.name}
                  defaultChecked
                  className="h-4 w-4 accent-emerald-600"
                />
                {f.label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Weight, waist, BMI and medication are always included.
          </p>
        </div>

        {state.message && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              state.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {state.message}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Sharing…" : "Share"}
        </button>
      </form>

      {shares.length > 0 && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {shares.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <span className="truncate">{s.recipientEmail}</span>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      s.status === "accepted"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {s.status === "accepted" ? "accepted" : "pending"}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Sees: {sharedSummary(s.flags)}
                </p>
              </div>
              <form action={revokeAction}>
                <input type="hidden" name="shareId" value={s.id} />
                <button
                  type="submit"
                  className="shrink-0 text-sm text-red-600 hover:underline"
                >
                  Revoke
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
