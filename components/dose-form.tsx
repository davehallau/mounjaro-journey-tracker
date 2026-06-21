"use client";

import { useActionState } from "react";
import Link from "next/link";
import { DatePicker } from "@/components/date-picker";
import { MedicationFields } from "@/components/medication-fields";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

type DoseDefaults = {
  recordedOn?: string;
  medication?: string | null;
  doseMg?: number | null;
};

export function DoseForm({
  action,
  defaultDate,
  dose,
  submitLabel = "Save",
  onCancel,
}: {
  action: Action;
  defaultDate?: string;
  dose?: DoseDefaults;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  const err = state.errors ?? {};
  const dateDefault = dose?.recordedOn ?? defaultDate;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
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
        <div className="grid grid-cols-2 gap-4 sm:col-span-2">
          <MedicationFields
            includeNone={false}
            defaultMedication={dose?.medication ?? null}
            defaultDose={dose?.doseMg ?? null}
          />
        </div>
      </div>

      {(err.medication || err.mounjaroDoseMg) && (
        <p className="field-error">{err.medication ?? err.mounjaroDoseMg}</p>
      )}
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
    </form>
  );
}
