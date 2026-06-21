"use client";

import { useActionState, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PrettySelect } from "@/components/pretty-select";
import { DatePicker } from "@/components/date-picker";
import { appetiteColor, scaleColor } from "@/lib/scale-colors";
import { EMPTY_FORM_STATE, SCALE_LABELS, type FormState } from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

type RecordingDefaults = {
  recordedOn?: string;
  weightKg?: string | number;
  waistCm?: string | number | null;
  mood?: number | null;
  energy?: number | null;
  appetite?: number | null;
  notes?: string | null;
};

function ScaleSelect({
  name,
  label,
  options,
  defaultValue,
  colorFor = scaleColor,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: number | null;
  colorFor?: (value: number) => string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <PrettySelect
        id={name}
        name={name}
        ariaLabel={label}
        defaultValue={defaultValue != null ? String(defaultValue) : ""}
        options={[
          { value: "", label: "—" },
          ...options.map((opt, i) => ({
            value: String(i + 1),
            label: opt,
            color: colorFor(i + 1),
          })),
        ]}
      />
    </div>
  );
}

export function RecordingForm({
  action,
  defaultDate,
  latest,
  recording,
  submitLabel = "Save",
  onCancel,
}: {
  action: Action;
  defaultDate?: string;
  /**
   * The participant's most recent recording, for a NEW entry: every field
   * (except the date) is pre-filled from it, and submitting an unchanged copy
   * asks for confirmation.
   */
  latest?: RecordingDefaults | null;
  recording?: RecordingDefaults;
  submitLabel?: string;
  /** When set, the Cancel button calls this instead of navigating away. */
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  const err = state.errors ?? {};
  // Field defaults: an edited recording, else the latest one (new entry).
  const defaults = recording ?? latest ?? null;
  // The date always defaults to today for a new entry (never the latest's date).
  const dateDefault = recording?.recordedOn ?? defaultDate;

  // Warn before adding a new recording identical to the latest (date aside).
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (confirmedRef.current) {
      confirmedRef.current = false; // user already confirmed — let it through
      return;
    }
    if (!latest) return;
    const fd = new FormData(e.currentTarget);
    const num = (v: unknown) => {
      if (v == null || v === "" || v === "none") return "";
      const n = Number(v);
      return Number.isNaN(n) ? String(v) : String(n);
    };
    // Notes aren't pre-filled, so they're excluded from the duplicate check.
    const same =
      num(fd.get("weightKg")) === num(latest.weightKg) &&
      num(fd.get("waistCm")) === num(latest.waistCm) &&
      num(fd.get("mood")) === num(latest.mood) &&
      num(fd.get("energy")) === num(latest.energy) &&
      num(fd.get("appetite")) === num(latest.appetite);
    if (same) {
      e.preventDefault();
      setConfirmOpen(true);
    }
  };

  const confirmAdd = () => {
    setConfirmOpen(false);
    confirmedRef.current = true;
    formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="label" htmlFor="recordedOn">
            Date
          </label>
          <DatePicker
            id="recordedOn"
            name="recordedOn"
            ariaLabel="Date"
            defaultValue={dateDefault ?? ""}
          />
          {err.recordedOn && <p className="field-error">{err.recordedOn}</p>}
        </div>

        <div>
          <label className="label" htmlFor="weightKg">
            Weight (kg)
          </label>
          <input
            id="weightKg"
            name="weightKg"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="20"
            max="400"
            defaultValue={defaults?.weightKg}
            required
            className="input"
          />
          {err.weightKg && <p className="field-error">{err.weightKg}</p>}
        </div>

        <div>
          <label className="label" htmlFor="waistCm">
            Waist (cm)
          </label>
          <input
            id="waistCm"
            name="waistCm"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="30"
            max="300"
            defaultValue={defaults?.waistCm ?? ""}
            className="input"
          />
          {err.waistCm && <p className="field-error">{err.waistCm}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScaleSelect
          name="mood"
          label="Mood"
          options={SCALE_LABELS.mood}
          defaultValue={defaults?.mood}
        />
        <ScaleSelect
          name="energy"
          label="Energy"
          options={SCALE_LABELS.energy}
          defaultValue={defaults?.energy}
        />
        <ScaleSelect
          name="appetite"
          label="Appetite"
          options={SCALE_LABELS.appetite}
          defaultValue={defaults?.appetite}
          colorFor={appetiteColor}
        />
      </div>

      <div>
        <label className="label" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={recording?.notes ?? ""}
          placeholder="Side effects, context, anything worth remembering…"
          className="input"
        />
        {err.notes && <p className="field-error">{err.notes}</p>}
      </div>

      {state.message && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        ) : (
          <Link href="/recordings" className="btn-secondary">
            Cancel
          </Link>
        )}
      </div>

      {confirmOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
              onClick={() => setConfirmOpen(false)}
              aria-hidden="true"
            />
            <div
              role="alertdialog"
              aria-modal="true"
              className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.515 2.625H3.72c-1.345 0-2.188-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900">
                    Add a duplicate recording?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    This is identical to your most recent recording — only the
                    date differs.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAdd}
                  className="btn-primary"
                >
                  Add anyway
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </form>
  );
}
