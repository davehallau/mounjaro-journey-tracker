"use client";

import { useState } from "react";
import { RecordingForm } from "@/components/recording-form";
import type { RecordingView } from "@/lib/data";
import type { FormState } from "@/lib/validation";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/**
 * On the Recordings tab the add form is collapsed behind a full-width button;
 * opening it shows the panel and hides the button (Cancel collapses it again).
 * Arriving from the dashboard's "+ Add recording" opens it immediately.
 */
export function AddRecordingPanel({
  action,
  defaultDate,
  latest,
  initialOpen = false,
}: {
  action: Action;
  defaultDate: string;
  latest: RecordingView | null;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary w-full py-2.5"
      >
        + Add recording
      </button>
    );
  }

  return (
    <section className="card">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Add a recording
      </h2>
      <RecordingForm
        action={action}
        defaultDate={defaultDate}
        latest={latest}
        submitLabel="Add recording"
        onCancel={() => setOpen(false)}
      />
    </section>
  );
}
