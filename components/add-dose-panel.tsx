"use client";

import { useState } from "react";
import { DoseForm } from "@/components/dose-form";
import type { FormState } from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Collapsible "Record Dose" panel, mirroring the body-data panel. */
export function AddDosePanel({
  action,
  defaultDate,
  initialOpen = false,
}: {
  action: Action;
  defaultDate: string;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary w-full py-2.5"
      >
        + Record Dose
      </button>
    );
  }

  return (
    <section className="card">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Record dose
      </h2>
      <DoseForm
        action={action}
        defaultDate={defaultDate}
        submitLabel="Save"
        onCancel={() => setOpen(false)}
      />
    </section>
  );
}
