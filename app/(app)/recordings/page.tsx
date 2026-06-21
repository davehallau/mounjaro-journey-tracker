import Link from "next/link";
import { format } from "date-fns";
import { getActiveParticipant, getRecordings } from "@/lib/data";
import { bmiBand, roundBmi } from "@/lib/bmi";
import { RecordingForm } from "@/components/recording-form";
import { BmiBadge } from "@/components/bmi-badge";
import { DeleteForm } from "@/components/delete-form";
import { createRecording, deleteRecording } from "./actions";

export async function generateMetadata() {
  const participant = await getActiveParticipant();
  return {
    title: participant ? `Recordings [${participant.name}]` : "Recordings",
  };
}

export default async function RecordingsPage() {
  const participant = await getActiveParticipant();

  if (!participant) {
    return (
      <div className="card text-center text-slate-500">
        Add a participant first, then you can start logging recordings.{" "}
        <Link
          href="/participants/new"
          className="font-medium text-emerald-700 hover:underline"
        >
          Add participant
        </Link>
      </div>
    );
  }

  const rows = (
    await getRecordings(participant.id, Number(participant.heightCm))
  ).slice()
    .reverse(); // newest first for the table
  const today = format(new Date(), "yyyy-MM-dd");
  // Default a new recording's dose to the most recent recorded dose.
  const lastDose = rows.find((r) => r.mounjaroDoseMg != null)?.mounjaroDoseMg ?? null;
  const createAction = createRecording.bind(null, participant.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Recordings — {participant.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Add today&apos;s reading, or edit a past one below.
        </p>
      </div>

      <section className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Add a recording
        </h2>
        <RecordingForm
          action={createAction}
          defaultDate={today}
          defaultDose={lastDose}
          submitLabel="Add recording"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          History ({rows.length})
        </h2>

        {rows.length === 0 ? (
          <div className="card text-sm text-slate-500">No recordings yet.</div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Weight</th>
                  <th className="px-4 py-3 text-center">BMI</th>
                  <th className="px-4 py-3">Waist</th>
                  <th className="px-4 py-3 text-center">Mood</th>
                  <th className="px-4 py-3 text-center">Energy</th>
                  <th className="px-4 py-3 text-center">Appetite</th>
                  <th className="px-4 py-3 text-center">Dose</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const band = bmiBand(r.bmi);
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                        {format(new Date(r.recordedOn), "d MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">{r.weightKg} kg</td>
                      <td className="px-4 py-3 text-center">
                        <BmiBadge
                          value={roundBmi(r.bmi)}
                          color={band.color}
                          label={band.label}
                          explanation={band.explanation}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.waistCm != null ? `${r.waistCm} cm` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {r.mood ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {r.energy ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {r.appetite ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {r.mounjaroDoseMg != null
                          ? `${r.mounjaroDoseMg} mg`
                          : "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-500">
                        {r.notes ?? ""}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/recordings/${r.id}`}
                            className="text-emerald-700 hover:underline"
                          >
                            Edit
                          </Link>
                          <DeleteForm
                            action={deleteRecording}
                            id={r.id}
                            label="Delete"
                            className="text-red-600 hover:underline"
                            confirmMessage="Delete this recording?"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
