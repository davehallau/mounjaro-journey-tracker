"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Action = (formData: FormData) => void | Promise<void>;

export function DeleteForm({
  action,
  id,
  label = "Delete",
  trigger,
  confirmMessage = "Are you sure? This can't be undone.",
  className = "btn-danger",
}: {
  action: Action;
  id: string;
  label?: string;
  /** Custom trigger content (e.g. an icon); falls back to the label text. */
  trigger?: React.ReactNode;
  confirmMessage?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        title={label}
        aria-label={label}
      >
        {trigger ?? label}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              role="alertdialog"
              aria-modal="true"
              className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
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
                    {confirmMessage}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    This can&apos;t be undone.
                  </p>
                </div>
              </div>

              <form
                action={action}
                className="mt-5 flex justify-end gap-2"
                onSubmit={() => setOpen(false)}
              >
                <input type="hidden" name="id" value={id} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  {label}
                </button>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
