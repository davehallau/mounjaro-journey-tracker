"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const WEEK_OPTS = { weekStartsOn: 1 } as const;

/**
 * Calendar date picker. Use uncontrolled with `name` inside a form, or
 * controlled with `value` + `onChange` (e.g. the dashboard range picker).
 * Values are ISO `yyyy-MM-dd` strings.
 */
export function DatePicker({
  id,
  name,
  value: controlledValue,
  defaultValue = "",
  onChange,
  min,
  max,
  ariaLabel,
  placeholder = "Select date",
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlledValue ?? uncontrolled;
  const selected = value ? parseISO(value) : null;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(selected ?? new Date());
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

  const minDate = min ? parseISO(min) : null;
  const maxDate = max ? parseISO(max) : null;
  const isDisabled = (d: Date) =>
    (minDate != null && isBefore(d, minDate)) ||
    (maxDate != null && isAfter(d, maxDate));

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(view), WEEK_OPTS),
        end: endOfWeek(endOfMonth(view), WEEK_OPTS),
      }),
    [view],
  );

  const toggle = () => {
    if (open) {
      setOpen(false);
    } else {
      setView(selected ?? new Date());
      setOpen(true);
    }
  };

  const choose = (d: string) => {
    if (controlledValue === undefined) setUncontrolled(d);
    onChange?.(d);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        id={id}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="input flex w-full items-center justify-between gap-2 text-left"
      >
        <span className={selected ? "" : "text-slate-400"}>
          {selected ? format(selected, "d MMM yyyy") : placeholder}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0 text-slate-400"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(subMonths(view, 1))}
              aria-label="Previous month"
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100"
            >
              <Chevron dir="left" />
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {format(view, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={() => setView(addMonths(view, 1))}
              aria-label="Next month"
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100"
            >
              <Chevron dir="right" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-slate-400">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d) => {
              const sel = selected != null && isSameDay(d, selected);
              const today = isSameDay(d, new Date());
              const outside = !isSameMonth(d, view);
              const dis = isDisabled(d);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={dis}
                  onClick={() => choose(format(d, "yyyy-MM-dd"))}
                  className={`h-8 rounded-md text-sm transition ${
                    sel
                      ? "bg-emerald-600 font-medium text-white"
                      : dis
                        ? "cursor-not-allowed text-slate-300"
                        : outside
                          ? "text-slate-400 hover:bg-slate-100"
                          : "text-slate-700 hover:bg-slate-100"
                  } ${today && !sel ? "ring-1 ring-emerald-400" : ""}`}
                >
                  {format(d, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => choose(format(new Date(), "yyyy-MM-dd"))}
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => choose("")}
                className="text-xs font-medium text-slate-500 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      {dir === "left" ? (
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 01.02 1.06L9.06 10l3.75 3.71a.75.75 0 11-1.04 1.08l-4.29-4.25a.75.75 0 010-1.08l4.29-4.25a.75.75 0 011.02-.02z"
          clipRule="evenodd"
        />
      ) : (
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01-.02-1.06L10.94 10 7.19 6.29a.75.75 0 111.04-1.08l4.29 4.25a.75.75 0 010 1.08l-4.29 4.25a.75.75 0 01-1.02.02z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
}
