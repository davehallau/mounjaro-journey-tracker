"use client";

import { useActionState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { Participant } from "@/lib/db/schema";
import { DatePicker } from "@/components/date-picker";
import { PrettySelect } from "@/components/pretty-select";
import {
  EMPTY_FORM_STATE,
  GENDERS,
  GENDER_LABELS,
  type FormState,
} from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export function ParticipantForm({
  action,
  participant,
  submitLabel = "Save",
}: {
  action: Action;
  participant?: Participant;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);
  const err = state.errors ?? {};
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={participant?.name}
          required
          className="input"
        />
        {err.name && <p className="field-error">{err.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="dob">
            Date of birth
          </label>
          <DatePicker
            id="dob"
            name="dob"
            ariaLabel="Date of birth"
            defaultValue={participant?.dob ?? ""}
            max={today}
            placeholder="Select date"
          />
          {err.dob && <p className="field-error">{err.dob}</p>}
        </div>

        <div>
          <label className="label" htmlFor="gender">
            Gender
          </label>
          <PrettySelect
            id="gender"
            name="gender"
            ariaLabel="Gender"
            defaultValue={participant?.gender ?? "undisclosed"}
            options={GENDERS.map((g) => ({ value: g, label: GENDER_LABELS[g] }))}
          />
          {err.gender && <p className="field-error">{err.gender}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="heightCm">
            Height (cm)
          </label>
          <input
            id="heightCm"
            name="heightCm"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="50"
            max="260"
            defaultValue={participant?.heightCm}
            required
            className="input"
          />
          {err.heightCm && <p className="field-error">{err.heightCm}</p>}
        </div>

        <div>
          <label className="label" htmlFor="targetBmi">
            Target BMI <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="targetBmi"
            name="targetBmi"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="10"
            max="60"
            defaultValue={participant?.targetBmi ?? ""}
            className="input"
          />
          {err.targetBmi && <p className="field-error">{err.targetBmi}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href="/participants" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
