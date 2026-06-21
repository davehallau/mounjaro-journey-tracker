import { notFound } from "next/navigation";
import { getDose } from "@/lib/data";
import { DoseForm } from "@/components/dose-form";
import { updateDose } from "../../actions";

export const metadata = { title: "Edit dose" };

export default async function EditDosePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dose = await getDose(id);
  if (!dose) notFound();

  const action = updateDose.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Edit dose</h1>
      <div className="card">
        <DoseForm
          action={action}
          dose={{
            recordedOn: dose.recordedOn,
            medication: dose.medication,
            doseMg: dose.doseMg == null ? null : Number(dose.doseMg),
          }}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
