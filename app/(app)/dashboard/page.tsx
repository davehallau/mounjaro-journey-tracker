import Link from "next/link";
import { cookies } from "next/headers";
import { getActiveParticipant, getRecordings } from "@/lib/data";
import { bmiBand, roundBmi } from "@/lib/bmi";
import { TrendsChart, type RangeState } from "@/components/charts/trends-chart";

async function readRange(): Promise<RangeState | undefined> {
  const raw = (await cookies()).get("dash_range")?.value;
  if (!raw) return undefined;
  try {
    const v = JSON.parse(decodeURIComponent(raw));
    if (v && (typeof v.preset === "number" || v.preset === "all")) {
      return { preset: v.preset, from: v.from ?? "", to: v.to ?? "" };
    }
  } catch {
    // ignore malformed cookie
  }
  return undefined;
}

export async function generateMetadata() {
  const active = await getActiveParticipant();
  return {
    title: active ? `Dashboard [${active.participant.name}]` : "Dashboard",
  };
}

export default async function DashboardPage() {
  const active = await getActiveParticipant();

  if (!active) {
    return (
      <div className="card text-center text-slate-500">
        Welcome! Add a participant to get started.{" "}
        <Link
          href="/participants/new"
          className="font-medium text-emerald-700 hover:underline"
        >
          Add participant
        </Link>
      </div>
    );
  }

  const { participant, fields, access } = active;
  const isOwner = access === "owner";

  const recordings = await getRecordings(
    participant.id,
    Number(participant.heightCm),
    fields,
  );

  if (recordings.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">
          {participant.name}
        </h1>
        <div className="card text-center text-slate-500">
          {isOwner ? (
            <>
              No recordings yet.{" "}
              <Link
                href="/recordings?new=1"
                className="font-medium text-emerald-700 hover:underline"
              >
                Add your first recording
              </Link>{" "}
              to see your graphs.
            </>
          ) : (
            "No recordings shared yet."
          )}
        </div>
      </div>
    );
  }

  const first = recordings[0];
  const last = recordings[recordings.length - 1];
  const weightChange = last.weightKg - first.weightKg;
  const band = bmiBand(last.bmi);
  const waistChange =
    first.waistCm != null && last.waistCm != null
      ? last.waistCm - first.waistCm
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          {participant.name}
          {!isOwner && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              shared · read-only
            </span>
          )}
        </h1>
        {isOwner && (
          <Link href="/recordings?new=1" className="btn-primary">
            + Add recording
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Latest weight" value={`${last.weightKg} kg`} />
        <Stat
          label="Change"
          value={`${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg`}
          tone={weightChange < 0 ? "good" : weightChange > 0 ? "bad" : "neutral"}
        />
        <Stat
          label="BMI"
          value={`${roundBmi(last.bmi)}`}
          sub={band.label}
          dot={band.color}
        />
        <Stat
          label="Current dose"
          value={
            last.mounjaroDoseMg != null ? `${last.mounjaroDoseMg} mg` : "—"
          }
          sub={waistChange != null ? `Waist ${waistChange > 0 ? "+" : ""}${waistChange.toFixed(1)} cm` : undefined}
        />
      </div>

      <TrendsChart
        data={recordings}
        targetBmi={
          participant.targetBmi != null ? Number(participant.targetBmi) : null
        }
        initialRange={await readRange()}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  dot,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  dot?: string;
  tone?: "good" | "bad" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "bad"
        ? "text-red-600"
        : "text-slate-900";
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 flex items-center gap-1.5 text-2xl font-semibold ${toneClass}`}>
        {dot && (
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: dot }}
          />
        )}
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
