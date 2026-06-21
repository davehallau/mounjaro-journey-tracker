"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doses, participants, recordings } from "@/lib/db/schema";
import { currentUserId, userOwnsParticipant } from "@/lib/data";
import {
  doseSchema,
  fieldErrors,
  formToObject,
  recordingSchema,
  type FormState,
  type RecordingInput,
} from "@/lib/validation";

function toValues(input: RecordingInput) {
  return {
    recordedOn: input.recordedOn,
    weightKg: String(input.weightKg),
    waistCm: input.waistCm != null ? String(input.waistCm) : null,
    mood: input.mood ?? null,
    energy: input.energy ?? null,
    appetite: input.appetite ?? null,
    notes: input.notes ?? null,
  };
}

async function userOwnsRecording(id: string, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: recordings.id })
    .from(recordings)
    .innerJoin(participants, eq(recordings.participantId, participants.id))
    .where(and(eq(recordings.id, id), eq(participants.ownerUserId, userId)))
    .limit(1);
  return rows.length > 0;
}

async function userOwnsDose(id: string, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: doses.id })
    .from(doses)
    .innerJoin(participants, eq(doses.participantId, participants.id))
    .where(and(eq(doses.id, id), eq(participants.ownerUserId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function createRecording(
  participantId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await currentUserId();
  if (!userId || !(await userOwnsParticipant(participantId, userId))) {
    return { ok: false, message: "Not allowed." };
  }

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
  const userId = await currentUserId();
  if (!userId || !(await userOwnsRecording(id, userId))) {
    return { ok: false, message: "Not allowed." };
  }

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
  const userId = await currentUserId();
  if (id && userId && (await userOwnsRecording(id, userId))) {
    await db.delete(recordings).where(eq(recordings.id, id));
    revalidatePath("/", "layout");
  }
}

function doseToValues(input: { recordedOn: string; medication: string; mounjaroDoseMg?: number }) {
  return {
    recordedOn: input.recordedOn,
    medication: input.medication,
    doseMg: input.mounjaroDoseMg != null ? String(input.mounjaroDoseMg) : null,
  };
}

export async function createDose(
  participantId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await currentUserId();
  if (!userId || !(await userOwnsParticipant(participantId, userId))) {
    return { ok: false, message: "Not allowed." };
  }
  const parsed = doseSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }
  const values = doseToValues(parsed.data);
  // One dose record per participant per day — re-entering a date updates it.
  await db
    .insert(doses)
    .values({ participantId, ...values })
    .onConflictDoUpdate({
      target: [doses.participantId, doses.recordedOn],
      set: values,
    });

  revalidatePath("/", "layout");
  redirect("/recordings");
}

export async function updateDose(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await currentUserId();
  if (!userId || !(await userOwnsDose(id, userId))) {
    return { ok: false, message: "Not allowed." };
  }
  const parsed = doseSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }
  try {
    await db
      .update(doses)
      .set(doseToValues(parsed.data))
      .where(eq(doses.id, id));
  } catch {
    return {
      ok: false,
      message: "There's already a dose on that date for this participant.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/recordings");
}

export async function deleteDose(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const userId = await currentUserId();
  if (id && userId && (await userOwnsDose(id, userId))) {
    await db.delete(doses).where(eq(doses.id, id));
    revalidatePath("/", "layout");
  }
}
