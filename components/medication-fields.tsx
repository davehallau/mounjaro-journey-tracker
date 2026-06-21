"use client";

import { useState } from "react";
import { PrettySelect } from "@/components/pretty-select";
import { MEDICATIONS, dosesFor } from "@/lib/medications";

/**
 * Medication type + a dose dropdown whose options follow the chosen medication.
 * Dose is hidden when medication is "None" (no 0 dose — pick None instead).
 */
export function MedicationFields({
  defaultMedication,
  defaultDose,
}: {
  defaultMedication?: string | null;
  defaultDose?: number | null;
}) {
  const initialMed = defaultMedication ?? "none";
  const [med, setMed] = useState(initialMed);
  const doses = dosesFor(med);
  const doseDefault =
    med === initialMed && defaultDose != null ? String(defaultDose) : "";

  return (
    <>
      <div>
        <label className="label" htmlFor="medication">
          Medication
        </label>
        <PrettySelect
          id="medication"
          name="medication"
          ariaLabel="Medication"
          value={med}
          onChange={setMed}
          options={MEDICATIONS.map((m) => ({ value: m.value, label: m.label }))}
        />
      </div>
      <div>
        <label className="label" htmlFor="mounjaroDoseMg">
          Dose
        </label>
        {med === "none" ? (
          <>
            <input type="hidden" name="mounjaroDoseMg" value="" />
            <div className="input flex items-center text-slate-400">—</div>
          </>
        ) : (
          <PrettySelect
            key={med}
            id="mounjaroDoseMg"
            name="mounjaroDoseMg"
            ariaLabel="Dose"
            defaultValue={doseDefault}
            options={[
              { value: "", label: "—" },
              ...doses.map((d) => ({ value: String(d), label: `${d} mg` })),
            ]}
          />
        )}
      </div>
    </>
  );
}
