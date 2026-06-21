"use client";

import { useRef, useState } from "react";

/**
 * BMI value with a coloured WHO-category dot and a custom hover tooltip.
 * The tooltip is fixed-positioned so it escapes the table's overflow clipping.
 */
export function BmiBadge({
  value,
  color,
  label,
  explanation,
}: {
  value: number;
  color: string;
  label: string;
  explanation: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.top, left: r.left + r.width / 2 });
  };

  return (
    <span
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
      className="inline-flex cursor-default items-center gap-1.5"
    >
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {value}
      {pos && (
        <span
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full"
          style={{ top: pos.top - 8, left: pos.left }}
        >
          <span className="block max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs shadow-md">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: color }}
              />
              <span className="font-semibold text-slate-900">{label}</span>
            </span>
            <span className="mt-1 block text-slate-500">{explanation}</span>
          </span>
        </span>
      )}
    </span>
  );
}
