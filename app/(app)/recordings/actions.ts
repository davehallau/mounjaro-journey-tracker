"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recordings } from "@/lib/db/schema";
import {
  fieldErrors,
  formToObject,
  recordingSchema,
  type FormState,
  type RecordingInput,
} from "@/lib/validation";

function toValues(input: RecordingInput) {
  const medication = input.medication === "none" ? null : input.medication;
  return {
    recordedOn: input.recordedOn,
    weightKg: String(input.weightKg),
    waistCm: input.waistCm != null ? String(input.waistCm) : null,
    mood: input.mood ?? null,
    energy: input.energy ?? null,
    appetite: input.appetite ?? null,
    medication,
    // Dose only applies when a medication is selected.
    mounjaroDoseMg:
      medication && input.mounjaroDoseMg != null
        ? String(input.mounjaroDoseMg)
        : null,
    notes: input.notes ?? null,
  };
}

export async function createRecording(
  participantId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = recordingSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  const values = toValues(parsed.data);
  // One recording per participant per day — re-entering a date updates it.
  await db
    .insert(recordings)
    .values({ participantId, ...values })
    .onConflictDoUpdate({
      target: [recordings.participantId, recordings.recordedOn],
      set: values,
    });

  revalidatePath("/", "layout");
  redirect("/recordings");
}

export async function updateRecording(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = recordingSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  try {
    await db
      .update(recordings)
      .set(toValues(parsed.data))
      .where(eq(recordings.id, id));
  } catch {
    return {
      ok: false,
      message: "There's already a recording on that date for this participant.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/recordings");
}

export async function deleteRecording(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await db.delete(recordings).where(eq(recordings.id, id));
    revalidatePath("/", "layout");
  }
}
