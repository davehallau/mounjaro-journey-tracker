import Link from "next/link";
import { differenceInYears } from "date-fns";
import { listParticipants } from "@/lib/data";
import { GENDER_LABELS } from "@/lib/validation";
import { DeleteForm } from "@/components/delete-form";
import { deleteParticipant } from "./actions";

export const metadata = { title: "Participants" };

export default async function ParticipantsPage() {
  const participants = await listParticipants();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Participants</h1>
        <Link href="/participants/new" className="btn-primary">
          + Add participant
        </Link>
      </div>

      {participants.length === 0 ? (
        <div className="card text-center text-slate-500">
          No participants yet.{" "}
          <Link
            href="/participants/new"
            className="font-medium text-emerald-700 hover:underline"
          >
            Add your first one
          </Link>{" "}
          to start tracking.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {participants.map((p) => (
            <li key={p.id} className="card flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {p.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {differenceInYears(new Date(), new Date(p.dob))} yrs ·{" "}
                  {GENDER_LABELS[p.gender as keyof typeof GENDER_LABELS] ??
                    p.gender}{" "}
                  · {Number(p.heightCm)} cm
                </p>
              </div>
              <div className="mt-auto flex items-center gap-2">
                <Link
                  href={`/participants/${p.id}`}
                  className="btn-secondary"
                >
                  Edit
                </Link>
                <DeleteForm
                  action={deleteParticipant}
                  id={p.id}
                  confirmMessage={`Delete ${p.name} and all their recordings? This can't be undone.`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
