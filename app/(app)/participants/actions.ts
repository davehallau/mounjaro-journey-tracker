"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { participants } from "@/lib/db/schema";
import { setActiveParticipantCookie } from "@/lib/data";
import {
  fieldErrors,
  formToObject,
  participantSchema,
  type FormState,
} from "@/lib/validation";

export async function createParticipant(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = participantSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  const { name, dob, gender, heightCm, targetBmi } = parsed.data;
  const [created] = await db
    .insert(participants)
    .values({
      name,
      dob,
      gender,
      heightCm: String(heightCm),
      targetBmi: targetBmi == null ? null : String(targetBmi),
    })
    .returning({ id: participants.id });

  // Make the new participant active so the rest of the app focuses on them.
  await setActiveParticipantCookie(created.id);
  revalidatePath("/", "layout");
  redirect("/participants");
}

export async function updateParticipant(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = participantSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  const { name, dob, gender, heightCm, targetBmi } = parsed.data;
  await db
    .update(participants)
    .set({
      name,
      dob,
      gender,
      heightCm: String(heightCm),
      targetBmi: targetBmi == null ? null : String(targetBmi),
    })
    .where(eq(participants.id, id));

  revalidatePath("/", "layout");
  redirect("/participants");
}

export async function deleteParticipant(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) {
    await db.delete(participants).where(eq(participants.id, id));
    revalidatePath("/", "layout");
  }
}
