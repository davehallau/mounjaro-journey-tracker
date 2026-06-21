import { notFound } from "next/navigation";
import { ParticipantForm } from "@/components/participant-form";
import { ShareManager } from "@/components/share-manager";
import { getOwnedParticipant } from "@/lib/data";
import { listSharesForParticipant } from "@/lib/shares";
import { updateParticipant, revokeShareAction, shareParticipant } from "../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const participant = await getOwnedParticipant(id);
  return {
    title: participant
      ? `Edit participant [${participant.name}]`
      : "Edit participant",
  };
}

export default async function EditParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const participant = await getOwnedParticipant(id);
  if (!participant) notFound();

  const action = updateParticipant.bind(null, id);
  const shareAction = shareParticipant.bind(null, id);
  const shares = await listSharesForParticipant(id);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Edit participant</h1>
      <div className="card">
        <ParticipantForm
          action={action}
          participant={participant}
          submitLabel="Save changes"
        />
      </div>

      <div className="card">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Sharing
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          Give another registered user read-only access. Choose which optional
          fields they can see — anything off is never sent to them.
        </p>
        <ShareManager
          shareAction={shareAction}
          revokeAction={revokeShareAction}
          shares={shares}
        />
      </div>
    </div>
  );
}
