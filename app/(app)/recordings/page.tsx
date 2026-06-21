import Link from "next/link";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { getActiveParticipant, getDoses, getRecordings } from "@/lib/data";
import { bmiBand, roundBmi } from "@/lib/bmi";
import { medicationLabel } from "@/lib/medications";
import { AddRecordingPanel } from "@/components/add-recording-panel";
import { AddDosePanel } from "@/components/add-dose-panel";
import { BmiBadge } from "@/components/bmi-badge";
import { CollapsibleSection } from "@/components/collapsible-section";
import { DeleteForm } from "@/components/delete-form";
import {
  createDose,
  createRecording,
  deleteDose,
  deleteRecording,
} from "./actions";

export async function generateMetadata() {
  const active = await getActiveParticipant();
  return {
    title: active ? `Recordings [${active.participant.name}]` : "Recordings",
  };
}

export default async function RecordingsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; dose?: string }>;
}) {
  const active = await getActiveParticipant();
  const sp = await searchParams;
  const c = await cookies();
  const dosesOpen = c.get("sec_doses")?.value !== "0";
  const bodyOpen = c.get("sec_body")?.value !== "0";

  if (!active) {
    return (
      <div className="card text-center text-slate-500">
        Add a participant first, then you can start logging.{" "}
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

  const bodyRows = (
    await getRecordings(participant.id, Number(participant.heightCm), fields)
  )
    .slice()
    .reverse();
  const doseRows = (await getDoses(participant.id)).slice().reverse();
  const today = format(new Date(), "yyyy-MM-dd");
  const latest = bodyRows[0] ?? null;
  const createBody = createRecording.bind(null, participant.id);
  const createDoseAction = createDose.bind(null, participant.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Recordings — {participant.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isOwner
            ? "Log a dose or your body & health data — separately."
            : "Shared with you · read-only."}
        </p>
      </div>

      {isOwner && (
        <div className="space-y-3">
          <AddDosePanel
            action={createDoseAction}
            defaultDate={today}
            latest={doseRows[0] ?? null}
            initialOpen={sp.dose != null}
          />
          <AddRecordingPanel
            action={createBody}
            defaultDate={today}
            latest={latest}
            initialOpen={sp.new != null}
          />
        </div>
      )}

      {/* Doses */}
      <CollapsibleSection
        id="doses"
        title={`Doses (${doseRows.length})`}
        defaultOpen={dosesOpen}
      >
        {doseRows.length === 0 ? (
          <div className="card text-sm text-slate-500">No doses recorded.</div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Medication</th>
                  <th className="px-4 py-3 text-center">Dose</th>
                  {isOwner && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {doseRows.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                      {format(new Date(d.recordedOn), "d MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {medicationLabel(d.medication)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {d.doseMg != null ? `${d.doseMg} mg` : "—"}
                    </td>
                    {isOwner && (
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/recordings/doses/${d.id}`}
                            title="Edit"
                            aria-label="Edit"
                            className="rounded-md p-1.5 text-emerald-700 transition hover:bg-emerald-50"
                          >
                            <PencilIcon />
                          </Link>
                          <DeleteForm
                            action={deleteDose}
                            id={d.id}
                            label="Delete"
                            trigger={<TrashIcon />}
                            className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50"
                            confirmMessage="Delete this dose?"
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>

      {/* Body & health */}
      <CollapsibleSection
        id="body"
        title={`Body & health (${bodyRows.length})`}
        defaultOpen={bodyOpen}
      >
        {bodyRows.length === 0 ? (
          <div className="card text-sm text-slate-500">
            No body &amp; health data recorded.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-3">
                    Date
                  </th>
                  <th className="px-4 py-3">Weight</th>
                  <th className="px-4 py-3 text-center">BMI</th>
                  <th className="px-4 py-3">Waist</th>
                  <th className="px-4 py-3 text-center">Mood</th>
                  <th className="px-4 py-3 text-center">Energy</th>
                  <th className="px-4 py-3 text-center">Appetite</th>
                  <th className="px-4 py-3">Notes</th>
                  {isOwner && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((r) => {
                  const band = bmiBand(r.bmi);
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-3 font-medium whitespace-nowrap text-slate-700">
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
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-500">
                        {r.notes ?? ""}
                      </td>
                      {isOwner && (
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/recordings/${r.id}`}
                              title="Edit"
                              aria-label="Edit"
                              className="rounded-md p-1.5 text-emerald-700 transition hover:bg-emerald-50"
                            >
                              <PencilIcon />
                            </Link>
                            <DeleteForm
                              action={deleteRecording}
                              id={r.id}
                              label="Delete"
                              trigger={<TrashIcon />}
                              className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50"
                              confirmMessage="Delete this recording?"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5a2 2 0 01-.879.515l-3 .857a.5.5 0 01-.617-.617l.857-3a2 2 0 01.515-.879l8.5-8.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.75 1a1 1 0 00-.95.68L7.4 3H4a1 1 0 000 2h12a1 1 0 100-2h-3.4l-.4-1.32A1 1 0 0011.25 1h-2.5zM5.06 7l.74 9.13A2 2 0 007.79 18h4.42a2 2 0 001.99-1.87L14.94 7H5.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}
