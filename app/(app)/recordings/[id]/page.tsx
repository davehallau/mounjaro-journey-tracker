import { notFound } from "next/navigation";
import { getActiveParticipant, getRecording } from "@/lib/data";
import { RecordingForm } from "@/components/recording-form";
import { updateRecording } from "../actions";

export async function generateMetadata() {
  const participant = await getActiveParticipant();
  return {
    title: participant ? `Edit recording [${participant.name}]` : "Edit recording",
  };
}

export default async function EditRecordingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recording = await getRecording(id);
  if (!recording) notFound();

  const action = updateRecording.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Edit recording</h1>
      <div className="card">
        <RecordingForm
          action={action}
          recording={recording}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
