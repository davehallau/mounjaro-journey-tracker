"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { selectParticipant } from "@/app/(app)/actions";

export type NavParticipant = { id: string; name: string; shared?: boolean };

export function ParticipantSwitcher({
  participants,
  activeId,
}: {
  participants: NavParticipant[];
  activeId: string | null;
}) {
  const [, startTransition] = useTransition();
  // Optimistic value so the control reflects the choice immediately; it falls
  // back to the server-confirmed activeId once revalidation completes.
  const [optimisticId, setOptimisticId] = useOptimistic(activeId ?? "");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
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

  if (participants.length === 0) return null;

  const active =
    participants.find((p) => p.id === optimisticId) ?? participants[0];

  const choose = (id: string) => {
    setOpen(false);
    if (id === optimisticId) return;
    startTransition(() => {
      setOptimisticId(id);
      selectParticipant(id);
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Active participant"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <span className="max-w-[10rem] truncate">{active.name}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-1 max-h-72 min-w-[12rem] overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5"
        >
          {participants.map((p) => {
            const selected = p.id === active.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(p.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    selected
                      ? "bg-emerald-50 font-medium text-emerald-700"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      selected ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                  <span className="truncate">{p.name}</span>
                  {p.shared && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      shared
                    </span>
                  )}
                  {selected && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="ml-auto h-4 w-4 text-emerald-600"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.8 6.79-6.8a1 1 0 011.42 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
