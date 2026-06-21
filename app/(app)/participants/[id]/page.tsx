import { notFound } from "next/navigation";
import { ParticipantForm } from "@/components/participant-form";
import { getParticipant } from "@/lib/data";
import { updateParticipant } from "../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const participant = await getParticipant(id);
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
  const participant = await getParticipant(id);
  if (!participant) notFound();

  const action = updateParticipant.bind(null, id);

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
    </div>
  );
}
