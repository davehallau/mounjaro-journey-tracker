"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO, subMonths } from "date-fns";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CurveFactory } from "victory-vendor/d3-shape";
import type { DoseView, RecordingView } from "@/lib/data";
import { BMI_BANDS, bmiBand, roundBmi } from "@/lib/bmi";
import { scaleColorLight } from "@/lib/scale-colors";
import { medicationLabel } from "@/lib/medications";
import { DatePicker } from "@/components/date-picker";

type Series = {
  key: string;
  label: string;
  color: string;
  axis: "main" | "scale" | "dose" | "scaleHidden" | "bmiHidden";
  unit?: string;
};

// Metrics on the Trends chart (independent selector).
const TREND_SERIES: Series[] = [
  { key: "weightKg", label: "Weight", color: "#059669", axis: "main", unit: "kg" },
  { key: "bmi", label: "BMI", color: "#2563eb", axis: "bmiHidden" },
  { key: "waistCm", label: "Waist", color: "#9333ea", axis: "main", unit: "cm" },
  { key: "mounjaroDoseMg", label: "Dose", color: "#6366f1", axis: "dose", unit: "mg" },
  { key: "appetite", label: "Appetite", color: "#e11d48", axis: "scaleHidden" },
];

// Metrics on the Wellbeing chart (independent selector).
const WELLBEING_SERIES: Series[] = [
  { key: "mood", label: "Mood", color: "#334155", axis: "scale" },
  { key: "energy", label: "Energy", color: "#0891b2", axis: "scale" },
  { key: "appetite", label: "Appetite", color: "#e11d48", axis: "scale" },
];

const PRESETS: { label: string; months: number | "all" }[] = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "All", months: "all" },
];

const fmtTs = (t: number) => format(new Date(t), "d MMM");
const ts = (d: string) => new Date(d).getTime();

// Straight lines with corners rounded to a small fixed radius (px). Because the
// segments stay straight, a solid line and its dotted companion underneath align
// exactly (no peeking), while every pivot gets the same gentle round.
const ROUND_RADIUS = 5;
const curveRounded: CurveFactory = (context) => {
  let pts: [number, number][] = [];
  return {
    areaStart() {},
    areaEnd() {},
    lineStart() {
      pts = [];
    },
    lineEnd() {
      const n = pts.length;
      if (n === 0) return;
      context.moveTo(pts[0][0], pts[0][1]);
      if (n === 1) return;
      for (let i = 1; i < n - 1; i++) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[i + 1];
        const d01 = Math.hypot(x1 - x0, y1 - y0) || 1;
        const d12 = Math.hypot(x2 - x1, y2 - y1) || 1;
        const r = Math.min(ROUND_RADIUS, d01 / 2, d12 / 2);
        context.lineTo(x1 + ((x0 - x1) * r) / d01, y1 + ((y0 - y1) * r) / d01);
        context.quadraticCurveTo(
          x1,
          y1,
          x1 + ((x2 - x1) * r) / d12,
          y1 + ((y2 - y1) * r) / d12,
        );
      }
      context.lineTo(pts[n - 1][0], pts[n - 1][1]);
    },
    point(x: number, y: number) {
      pts.push([x, y]);
    },
  };
};

export type RangeState = { preset: number | "all"; from: string; to: string };

export function TrendsChart({
  data,
  doses,
  targetBmi,
  initialRange,
}: {
  data: RecordingView[];
  doses: DoseView[];
  targetBmi?: number | null;
  initialRange?: RangeState;
}) {
  const [preset, setPreset] = useState<number | "all">(
    initialRange?.preset ?? "all",
  );
  const [from, setFrom] = useState(initialRange?.from ?? "");
  const [to, setTo] = useState(initialRange?.to ?? "");

  // Remember the chosen range across visits (read server-side into initialRange).
  useEffect(() => {
    const value = encodeURIComponent(JSON.stringify({ preset, from, to }));
    document.cookie = `dash_range=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, [preset, from, to]);
  // Two independent visibility maps, one per chart.
  const [trendsVisible, setTrendsVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(TREND_SERIES.map((s) => [s.key, s.key !== "bmi"])),
  );
  const [wellbeingVisible, setWellbeingVisible] = useState<
    Record<string, boolean>
  >(Object.fromEntries(WELLBEING_SERIES.map((s) => [s.key, s.key !== "energy"])));

  const toggleTrend = (key: string) =>
    setTrendsVisible((v) => ({ ...v, [key]: !v[key] }));
  const toggleWellbeing = (key: string) =>
    setWellbeingVisible((v) => ({ ...v, [key]: !v[key] }));

  const rangeStart = from
    ? new Date(from)
    : preset !== "all"
      ? subMonths(new Date(), preset)
      : null;
  const rangeEnd = to ? new Date(to) : null;
  const inRange = (d: string) => {
    const t = new Date(d);
    if (rangeStart && t < rangeStart) return false;
    if (rangeEnd && t > rangeEnd) return false;
    return true;
  };

  // Body recordings and dose administrations are recorded independently, so the
  // x-axis is the union of both sets of dates.
  const recsInRange = data.filter((d) => inRange(d.recordedOn));
  const dosesInRange = doses.filter((d) => inRange(d.recordedOn));
  const recByDate = new Map(recsInRange.map((r) => [r.recordedOn, r]));
  const doseByDate = new Map(dosesInRange.map((d) => [d.recordedOn, d]));
  const allDates = Array.from(
    new Set([...recByDate.keys(), ...doseByDate.keys()]),
  ).sort();

  const chartData = allDates.map((date) => {
    const r = recByDate.get(date);
    const d = doseByDate.get(date);
    return {
      recordedOn: date,
      t: ts(date),
      weightKg: r?.weightKg ?? null,
      waistCm: r?.waistCm ?? null,
      mood: r?.mood ?? null,
      energy: r?.energy ?? null,
      appetite: r?.appetite ?? null,
      bmi: r ? roundBmi(r.bmi) : null,
      doseMed: d?.medication ?? null,
      doseMg: d?.doseMg ?? null,
      // Dotted companions (filled below) bridge gaps left by days that only
      // have a dose (no body reading) or vice versa.
      weightKgDotted: null as number | null,
      bmiDotted: null as number | null,
      waistCmDotted: null as number | null,
      moodDotted: null as number | null,
      energyDotted: null as number | null,
      appetiteDotted: null as number | null,
    };
  });

  for (const key of [
    "weightKg",
    "bmi",
    "waistCm",
    "mood",
    "energy",
    "appetite",
  ] as const) {
    const dottedKey = `${key}Dotted` as const;
    const reals: number[] = [];
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i][key] != null) reals.push(i);
    }
    if (!reals.length) continue;
    const firstIdx = reals[0];
    const lastIdx = reals[reals.length - 1];
    const firstVal = chartData[firstIdx][key] as number;
    const lastVal = chartData[lastIdx][key] as number;
    for (let i = 0; i < chartData.length; i++) {
      const real = chartData[i][key];
      if (real != null) {
        chartData[i][dottedKey] = real;
      } else if (i < firstIdx) {
        chartData[i][dottedKey] = firstVal; // flat lead-in
      } else if (i > lastIdx) {
        chartData[i][dottedKey] = lastVal; // flat lead-out
      } else {
        let a = i;
        let c = i;
        while (chartData[a][key] == null) a--;
        while (chartData[c][key] == null) c++;
        const va = chartData[a][key] as number;
        const vc = chartData[c][key] as number;
        chartData[i][dottedKey] = va + ((vc - va) * (i - a)) / (c - a);
      }
    }
  }

  const bmiValues = chartData
    .map((d) => d.bmi)
    .filter((v): v is number => v != null);
  const bmiMax = bmiValues.length ? Math.max(...bmiValues) : 30;
  const bmiMin = bmiValues.length ? Math.min(...bmiValues) : 18;

  // Shared BMI domain (at least 1 unit clearance + the target line), used by the
  // dedicated BMI chart and the hidden BMI axis on the Trends chart so the BMI
  // line reads identically in both.
  const bmiDomain: [number, number] = [
    Math.floor(Math.min(bmiMin, targetBmi ?? Infinity) - 1),
    Math.ceil(Math.max(bmiMax, targetBmi ?? -Infinity) + 1),
  ];

  // Left-axis domain: scaled to the *visible* main-axis series (not zero-based),
  // padded by 20% of the data range, then rounded out to the nearest 5. Recomputes
  // as series are toggled on/off.
  const mainAxis: {
    domain: [number | string, number | string];
    ticks?: number[];
  } = (() => {
    const keys = TREND_SERIES.filter(
      (s) => s.axis === "main" && trendsVisible[s.key],
    ).map((s) => s.key);
    const vals: number[] = [];
    for (const d of chartData) {
      for (const k of keys) {
        const v = (d as Record<string, unknown>)[k];
        if (typeof v === "number" && !Number.isNaN(v)) vals.push(v);
      }
    }
    if (!vals.length)
      return { domain: [0, "auto"] as [number | string, number | string] };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min || max || 1) * 0.2;
    const lo = Math.floor((min - pad) / 5) * 5;
    const hi = Math.ceil((max + pad) / 5) * 5;
    const ticks: number[] = [];
    for (let t = lo; t <= hi; t += 5) ticks.push(t);
    return { domain: [lo, hi], ticks };
  })();

  // Mood drawn as a background tint: one band per gap between recordings,
  // coloured by the average mood of its endpoints.
  const moodBands: { x1: number; x2: number; color: string }[] = (() => {
    const bands: { x1: number; x2: number; color: string }[] = [];
    for (let i = 0; i < chartData.length - 1; i++) {
      const pair = [chartData[i].mood, chartData[i + 1].mood].filter(
        (v): v is number => v != null,
      );
      if (!pair.length) continue;
      const avg = pair.reduce((s, v) => s + v, 0) / pair.length;
      bands.push({
        x1: chartData[i].t,
        x2: chartData[i + 1].t,
        color: scaleColorLight(avg),
      });
    }
    return bands;
  })();

  // Shaded blocks spanning each run of the same medication + dose, carried
  // forward until the next change (or the chart's end). Doses are oldest-first.
  const lastDate = allDates[allDates.length - 1];
  const doseBlocks: { x1: number; x2: number; label: string }[] = [];
  const sameDose = (a: DoseView, b: DoseView) =>
    a.medication === b.medication && a.doseMg === b.doseMg;
  let doseStart = 0;
  for (let i = 1; i <= dosesInRange.length; i++) {
    if (
      i === dosesInRange.length ||
      !sameDose(dosesInRange[i], dosesInRange[doseStart])
    ) {
      const cur = dosesInRange[doseStart];
      doseBlocks.push({
        x1: ts(cur.recordedOn),
        x2: ts(
          i < dosesInRange.length
            ? dosesInRange[i].recordedOn
            : (lastDate ?? cur.recordedOn),
        ),
        label: `${medicationLabel(cur.medication)}${
          cur.doseMg != null ? ` ${cur.doseMg} mg` : ""
        }`,
      });
      doseStart = i;
    }
  }
  const doseDates = dosesInRange.map((d) => ts(d.recordedOn));

  const customActive = from !== "" || to !== "";

  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!rangeOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (rangeRef.current && !rangeRef.current.contains(e.target as Node))
        setRangeOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [rangeOpen]);

  const rangeLabel = customActive
    ? `${from ? format(parseISO(from), "d MMM yyyy") : "Start"} – ${
        to ? format(parseISO(to), "d MMM yyyy") : "Now"
      }`
    : PRESETS.find((p) => p.months === preset)?.label === "All"
      ? "All time"
      : `Last ${PRESETS.find((p) => p.months === preset)?.label}`;

  return (
    <div className="space-y-5">
      {/* Date range — applies to every chart */}
      <div className="card">
        <div ref={rangeRef} className="relative">
          <button
            type="button"
            onClick={() => setRangeOpen((o) => !o)}
            aria-haspopup="dialog"
            aria-expanded={rangeOpen}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-slate-400"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z"
                clipRule="evenodd"
              />
            </svg>
            <span className="flex-1 text-left">{rangeLabel}</span>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                rangeOpen ? "rotate-180" : ""
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

          {rangeOpen && (
            <div className="absolute left-0 z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5">
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => {
                  const active = !customActive && preset === p.months;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setPreset(p.months);
                        setFrom("");
                        setTo("");
                        setRangeOpen(false);
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Custom range
                </p>
                <div className="space-y-2">
                  <div>
                    <label className="label !mb-1 text-xs">From</label>
                    <DatePicker
                      value={from}
                      onChange={setFrom}
                      ariaLabel="From date"
                      placeholder="Start"
                    />
                  </div>
                  <div>
                    <label className="label !mb-1 text-xs">To</label>
                    <DatePicker
                      value={to}
                      onChange={setTo}
                      ariaLabel="To date"
                      placeholder="Now"
                    />
                  </div>
                </div>
                {customActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setFrom("");
                      setTo("");
                    }}
                    className="mt-2 text-xs font-medium text-emerald-700 hover:underline"
                  >
                    Clear custom range
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="card text-center text-sm text-slate-500">
          No recordings in this range.
        </div>
      ) : (
        <>
          {/* Trends chart */}
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Trends
            </h2>
            <MetricToggles
              series={TREND_SERIES}
              visible={trendsVisible}
              onToggle={toggleTrend}
            />
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 8, bottom: 5, left: -8 }}
              >
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={fmtTs}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  minTickGap={24}
                />
                {/* Weight / waist — the only visible axis, always on the left. */}
                <YAxis
                  yAxisId="main"
                  orientation="left"
                  domain={mainAxis.domain}
                  ticks={mainAxis.ticks}
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  width={44}
                />
                {/* Hidden axes (kept on the right so the left side is weight only). */}
                <YAxis yAxisId="dose" orientation="right" domain={[0, 20]} hide />
                <YAxis yAxisId="scaleHidden" orientation="right" domain={[0, 5]} hide />
                <YAxis yAxisId="bmiHidden" orientation="right" domain={bmiDomain} hide />
                {/* Shaded band per medication+dose run (behind the lines). */}
                {trendsVisible.mounjaroDoseMg &&
                  doseBlocks.map((b, i) => (
                    <ReferenceArea
                      key={`dose-block-${i}`}
                      yAxisId="main"
                      x1={b.x1}
                      x2={b.x2}
                      fill="#6366f1"
                      fillOpacity={0.08}
                      ifOverflow="extendDomain"
                      label={{
                        value: b.label,
                        position: "insideBottom",
                        fill: "#6366f1",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                  ))}
                <Tooltip content={<TrendsTooltip />} />
                {/* Dotted companions (gaps + edges) drawn under the solid lines. */}
                {trendsVisible.weightKg && (
                  <Line
                    yAxisId="main"
                    type={curveRounded}
                    dataKey="weightKgDotted"
                    name="Weight"
                    stroke="#059669"
                    strokeWidth={2}
                    strokeDasharray="1 4"
                    strokeLinecap="round"
                    dot={false}
                    legendType="none"
                    isAnimationActive={false}
                  />
                )}
                {trendsVisible.bmi && (
                  <Line
                    yAxisId="bmiHidden"
                    type={curveRounded}
                    dataKey="bmiDotted"
                    name="BMI"
                    stroke="#2563eb"
                    strokeWidth={2}
                    strokeDasharray="1 4"
                    strokeLinecap="round"
                    dot={false}
                    legendType="none"
                    isAnimationActive={false}
                  />
                )}
                {trendsVisible.waistCm && (
                  <Line
                    yAxisId="main"
                    type={curveRounded}
                    dataKey="waistCmDotted"
                    name="Waist"
                    stroke="#9333ea"
                    strokeWidth={2}
                    strokeDasharray="1 4"
                    strokeLinecap="round"
                    dot={false}
                    legendType="none"
                    isAnimationActive={false}
                  />
                )}
                {trendsVisible.appetite && (
                  <Line
                    yAxisId="scaleHidden"
                    type={curveRounded}
                    dataKey="appetiteDotted"
                    name="Appetite"
                    stroke="#e11d48"
                    strokeWidth={2}
                    strokeDasharray="1 4"
                    strokeLinecap="round"
                    dot={false}
                    legendType="none"
                    isAnimationActive={false}
                  />
                )}
                {/* Solid lines — adjacent readings only; gaps fall through to dotted. */}
                {TREND_SERIES.filter(
                  (s) => s.axis === "main" && trendsVisible[s.key],
                ).map((s) => (
                  <Line
                    key={s.key}
                    yAxisId="main"
                    type={curveRounded}
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
                {trendsVisible.appetite && (
                  <Line
                    yAxisId="scaleHidden"
                    type={curveRounded}
                    dataKey="appetite"
                    name="Appetite"
                    stroke="#e11d48"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
                {trendsVisible.bmi && (
                  <Line
                    yAxisId="bmiHidden"
                    type={curveRounded}
                    dataKey="bmi"
                    name="BMI"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
                {/* A needle marker at each date a dose was administered. */}
                {trendsVisible.mounjaroDoseMg &&
                  doseDates.map((d, i) => (
                    <ReferenceArea
                      key={`needle-${i}`}
                      yAxisId="main"
                      x1={d}
                      x2={d}
                      fill="none"
                      stroke="none"
                      ifOverflow="extendDomain"
                      label={{ value: "💉", position: "insideTop", fontSize: 13 }}
                    />
                  ))}
              </ComposedChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-slate-400">
              Weight and waist use the left axis; BMI and appetite are overlaid on
              hidden scales. Shaded bands show each medication + dose period, with
              a 💉 marking each dose administration.
            </p>
          </div>

          {/* Wellbeing chart (1–5 scales) */}
          <div className="card">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Wellbeing
            </h2>
            <p className="mb-3 text-xs text-slate-400">
              Energy and appetite (1–5). Mood (1–7) shows as a line over a
              background tint (red = low, green = good, purple = hyper). Dotted
              segments bridge missing readings.
            </p>
            <MetricToggles
              series={WELLBEING_SERIES}
              visible={wellbeingVisible}
              onToggle={toggleWellbeing}
            />
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 8, bottom: 5, left: -8 }}
              >
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={fmtTs}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="scale"
                  domain={[0, 7]}
                  ticks={[1, 2, 3, 4, 5, 6, 7]}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  width={28}
                />
                {wellbeingVisible.mood &&
                  moodBands.map((b, i) => (
                    <ReferenceArea
                      key={`mood-${i}`}
                      yAxisId="scale"
                      x1={b.x1}
                      x2={b.x2}
                      y1={0}
                      y2={7}
                      fill={b.color}
                      fillOpacity={0.85}
                      ifOverflow="extendDomain"
                    />
                  ))}
                <Tooltip content={<TrendsTooltip />} />
                {/* Dotted companions (gaps + edges) drawn under the solid lines. */}
                {wellbeingVisible.energy && (
                  <Line
                    yAxisId="scale"
                    type={curveRounded}
                    dataKey="energyDotted"
                    name="Energy"
                    stroke="#0891b2"
                    strokeWidth={2}
                    strokeDasharray="1 4"
                    strokeLinecap="round"
                    dot={false}
                    legendType="none"
                    isAnimationActive={false}
                  />
                )}
                {wellbeingVisible.appetite && (
                  <Line
                    yAxisId="scale"
                    type={curveRounded}
                    dataKey="appetiteDotted"
                    name="Appetite"
                    stroke="#e11d48"
                    strokeWidth={2}
                    strokeDasharray="1 4"
                    strokeLinecap="round"
                    dot={false}
                    legendType="none"
                    isAnimationActive={false}
                  />
                )}
                {wellbeingVisible.mood && (
                  <Line
                    yAxisId="scale"
                    type={curveRounded}
                    dataKey="moodDotted"
                    name="Mood"
                    stroke="#334155"
                    strokeWidth={2}
                    strokeDasharray="1 4"
                    strokeLinecap="round"
                    dot={false}
                    legendType="none"
                    isAnimationActive={false}
                  />
                )}
                {/* Solid lines — adjacent readings only; gaps fall through to dotted. */}
                {WELLBEING_SERIES.filter(
                  (s) => s.key !== "mood" && wellbeingVisible[s.key],
                ).map((s) => (
                  <Line
                    key={s.key}
                    yAxisId="scale"
                    type={curveRounded}
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
                {wellbeingVisible.mood && (
                  <Line
                    yAxisId="scale"
                    type={curveRounded}
                    dataKey="mood"
                    name="Mood"
                    stroke="#334155"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* BMI chart with WHO colour bands */}
          <div className="card">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
              BMI &amp; WHO categories
            </h2>
            <p className="mb-3 text-xs text-slate-400">
              Hover a point for its category. Bands show the WHO healthy-weight
              ranges.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 8, bottom: 5, left: -8 }}
              >
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={fmtTs}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  minTickGap={24}
                />
                <YAxis
                  domain={bmiDomain}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  width={44}
                />
                {BMI_BANDS.map((b) => (
                  <ReferenceArea
                    key={b.label}
                    y1={b.min}
                    y2={Number.isFinite(b.max) ? b.max : 100}
                    fill={b.color}
                    fillOpacity={0.1}
                    ifOverflow="hidden"
                  />
                ))}
                {targetBmi != null && (
                  <ReferenceLine
                    y={targetBmi}
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    ifOverflow="extendDomain"
                    label={{
                      value: `Target ${targetBmi}`,
                      position: "insideTopRight",
                      fill: "#dc2626",
                      fontSize: 11,
                    }}
                  />
                )}
                <Tooltip content={<BmiTooltip />} />
                <Line
                  type={curveRounded}
                  dataKey="bmi"
                  name="BMI"
                  stroke="#334155"
                  strokeWidth={2}
                  connectNulls
                  dot={<BmiDot />}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// A row of pill toggles for one chart's metrics.
function MetricToggles({
  series,
  visible,
  onToggle,
}: {
  series: Series[];
  visible: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {series.map((s) => (
        <button
          key={s.key}
          onClick={() => onToggle(s.key)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
            visible[s.key]
              ? "border-slate-300 bg-white text-slate-700"
              : "border-slate-200 bg-slate-50 text-slate-400"
          }`}
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: visible[s.key] ? s.color : "#cbd5e1" }}
          />
          {s.label}
          {s.unit ? ` (${s.unit})` : ""}
        </button>
      ))}
    </div>
  );
}

// Colour each BMI point by its WHO category.
function BmiDot(props: {
  cx?: number;
  cy?: number;
  payload?: { bmi: number };
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return <g />;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3.5}
      fill={bmiBand(payload.bmi).color}
      stroke="#fff"
      strokeWidth={1}
    />
  );
}

type TooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string | number;
    payload?: { doseMed?: string | null; doseMg?: number | null };
  }>;
};

function TrendsTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  // Drop empty series and the dotted companions (interpolated, not real data),
  // and dedupe by name.
  const seen = new Set<string>();
  const items = payload.filter((p) => {
    const name = p.name ?? "";
    if (p.value == null || seen.has(name)) return false;
    if (String(p.dataKey ?? "").includes("Dotted")) return false;
    seen.add(name);
    return true;
  });
  const row = payload[0]?.payload;
  const hasDose = row?.doseMed != null;
  if (!items.length && !hasDose) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-700">
        {label ? format(new Date(label), "d MMM yyyy") : ""}
      </p>
      <ul className="space-y-0.5">
        {items.map((p, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-medium text-slate-800">{p.value}</span>
          </li>
        ))}
        {hasDose && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true">💉</span>
            <span className="text-slate-500">Dose:</span>
            <span className="font-medium text-slate-800">
              {medicationLabel(row?.doseMed)}
              {row?.doseMg != null ? ` ${row.doseMg} mg` : ""}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

function BmiTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const bmi = payload[0]?.value;
  if (bmi == null) return null;
  const band = bmiBand(bmi);
  return (
    <div className="max-w-[220px] rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-700">
        {label ? format(new Date(label), "d MMM yyyy") : ""}
      </p>
      <p className="flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: band.color }}
        />
        <span className="font-semibold text-slate-900">BMI {bmi}</span>
        <span className="text-slate-500">· {band.label}</span>
      </p>
      <p className="mt-1 text-slate-500">{band.explanation}</p>
    </div>
  );
}
