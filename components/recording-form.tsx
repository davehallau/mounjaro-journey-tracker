"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  DOSES,
  EMPTY_FORM_STATE,
  SCALE_LABELS,
  type FormState,
} from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

type RecordingDefaults = {
  recordedOn?: string;
  weightKg?: string | number;
  waistCm?: string | number | null;
  mood?: number | null;
  energy?: number | null;
  appetite?: number | null;
  mounjaroDoseMg?: string | number | null;
  notes?: string | null;
};

function ScaleSelect({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: number | null;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue != null ? String(defaultValue) : ""}
        className="input"
      >
        <option value="">—</option>
        {options.map((opt, i) => (
          <option key={i} value={i + 1}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function RecordingForm({
  action,
  defaultDate,
  recording,
  submitLabel = "Save",
}: {
  action: Action;
  defaultDate?: string;
  recording?: RecordingDefaults;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  const err = state.errors ?? {};
  const doseDefault =
    recording?.mounjaroDoseMg != null
      ? String(Number(recording.mounjaroDoseMg))
      : "none";

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="recordedOn">
            Date
          </label>
          <input
            id="recordedOn"
            name="recordedOn"
            type="date"
            defaultValue={recording?.recordedOn ?? defaultDate}
            required
            className="input"
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
            step="0.1"
            min="20"
            max="400"
            defaultValue={recording?.weightKg}
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
            step="0.1"
            min="30"
            max="300"
            defaultValue={recording?.waistCm ?? ""}
            className="input"
          />
          {err.waistCm && <p className="field-error">{err.waistCm}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ScaleSelect
          name="mood"
          label="Mood"
          options={SCALE_LABELS.mood}
          defaultValue={recording?.mood}
        />
        <ScaleSelect
          name="energy"
          label="Energy"
          options={SCALE_LABELS.energy}
          defaultValue={recording?.energy}
        />
        <ScaleSelect
          name="appetite"
          label="Appetite"
          options={SCALE_LABELS.appetite}
          defaultValue={recording?.appetite}
        />
        <div>
          <label className="label" htmlFor="mounjaroDoseMg">
            Mounjaro dose
          </label>
          <select
            id="mounjaroDoseMg"
            name="mounjaroDoseMg"
            defaultValue={doseDefault}
            className="input"
          >
            <option value="none">None</option>
            {DOSES.map((d) => (
              <option key={d} value={d}>
                {d} mg
              </option>
            ))}
          </select>
          {err.mounjaroDoseMg && (
            <p className="field-error">{err.mounjaroDoseMg}</p>
          )}
        </div>
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
        <Link href="/recordings" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
