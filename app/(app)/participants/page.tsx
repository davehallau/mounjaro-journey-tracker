import Link from "next/link";
import { differenceInYears } from "date-fns";
import { currentUserId, listOwnedParticipants } from "@/lib/data";
import { shareCountsForOwner } from "@/lib/shares";
import { GENDER_LABELS } from "@/lib/validation";
import { DeleteForm } from "@/components/delete-form";
import { deleteParticipant } from "./actions";

export const metadata = { title: "Participants" };

export default async function ParticipantsPage() {
  const userId = await currentUserId();
  const participants = userId ? await listOwnedParticipants(userId) : [];
  const shareCounts = userId ? await shareCountsForOwner(userId) : {};

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
          {participants.map((p) => {
            const counts = shareCounts[p.id] ?? { accepted: 0, pending: 0 };
            return (
              <li key={p.id} className="card flex flex-col gap-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {p.name}
                    </h2>
                    {(counts.accepted > 0 || counts.pending > 0) && (
                      <span className="flex shrink-0 items-center gap-2 text-xs">
                        {counts.accepted > 0 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700"
                            title={`${counts.accepted} accepted share${counts.accepted > 1 ? "s" : ""}`}
                          >
                            <CheckIcon />
                            {counts.accepted}
                          </span>
                        )}
                        {counts.pending > 0 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700"
                            title={`${counts.pending} pending invite${counts.pending > 1 ? "s" : ""}`}
                          >
                            <ClockIcon />
                            {counts.pending}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {differenceInYears(new Date(), new Date(p.dob))} yrs ·{" "}
                    {GENDER_LABELS[p.gender as keyof typeof GENDER_LABELS] ??
                      p.gender}{" "}
                    · {Number(p.heightCm)} cm
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <Link href={`/participants/${p.id}`} className="btn-secondary">
                    Edit
                  </Link>
                  <Link
                    href={`/participants/${p.id}#sharing`}
                    className="btn-secondary"
                  >
                    Share
                  </Link>
                  <DeleteForm
                    action={deleteParticipant}
                    id={p.id}
                    confirmMessage={`Delete ${p.name} and all their recordings? This can't be undone.`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.8 6.79-6.8a1 1 0 011.42 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-12a.75.75 0 00-1.5 0v4c0 .2.08.39.22.53l2.5 2.5a.75.75 0 101.06-1.06L10.75 9.69V6z"
        clipRule="evenodd"
      />
    </svg>
  );
}
