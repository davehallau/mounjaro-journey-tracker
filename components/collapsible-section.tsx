"use client";

import { useState } from "react";

/**
 * A titled section that expands/collapses via a twisty. Open by default; the
 * choice is remembered in a cookie (read server-side into defaultOpen so there's
 * no flash on load).
 */
export function CollapsibleSection({
  id,
  title,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    document.cookie = `sec_${id}=${next ? "1" : "0"}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; samesite=lax`;
  };

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-700"
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? "rotate-90" : ""
          }`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M7.21 5.23a.75.75 0 011.06-.02l4.25 4.29a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 11-1.06-1.06L10.94 10 7.21 6.29a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </svg>
        {title}
      </button>
      {open && children}
    </section>
  );
}
