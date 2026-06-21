import { ParticipantForm } from "@/components/participant-form";
import { createParticipant } from "../actions";

export const metadata = { title: "Add participant" };

export default function NewParticipantPage() {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Add participant</h1>
      <div className="card">
        <ParticipantForm action={createParticipant} submitLabel="Create" />
      </div>
    </div>
  );
}
