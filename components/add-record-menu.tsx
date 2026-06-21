"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Dashboard "+ Add recording" button that asks which kind to add, in place,
 * then routes to the Recordings tab with the matching panel open.
 */
export function AddRecordMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-primary"
      >
        + Add recording
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5"
        >
          <Link
            href="/recordings?dose=1"
            role="menuitem"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            💉 Record Dose
          </Link>
          <Link
            href="/recordings?new=1"
            role="menuitem"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            ⚖️ Record Body &amp; Health Data
          </Link>
        </div>
      )}
    </div>
  );
}
