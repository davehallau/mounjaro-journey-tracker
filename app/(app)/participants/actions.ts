"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { participants, users } from "@/lib/db/schema";
import {
  currentUserId,
  setActiveParticipantCookie,
  userOwnsParticipant,
} from "@/lib/data";
import {
  createOrUpdateShare,
  findActiveUserByEmail,
  revokeShare,
  type ShareFlags,
} from "@/lib/shares";
import { sendShareInviteEmail } from "@/lib/email";
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
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: "Not signed in." };

  const parsed = participantSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  const { name, dob, gender, heightCm, targetBmi } = parsed.data;
  const [created] = await db
    .insert(participants)
    .values({
      ownerUserId: userId,
      name,
      dob,
      gender,
      heightCm: String(heightCm),
      targetBmi: targetBmi == null ? null : String(targetBmi),
    })
    .returning({ id: participants.id });

  await setActiveParticipantCookie(created.id);
  revalidatePath("/", "layout");
  redirect("/participants");
}

export async function updateParticipant(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await currentUserId();
  if (!userId || !(await userOwnsParticipant(id, userId))) {
    return { ok: false, message: "Not allowed." };
  }

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
    .where(
      and(eq(participants.id, id), eq(participants.ownerUserId, userId)),
    );

  revalidatePath("/", "layout");
  redirect("/participants");
}

export async function deleteParticipant(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const userId = await currentUserId();
  if (id && userId) {
    await db
      .delete(participants)
      .where(
        and(eq(participants.id, id), eq(participants.ownerUserId, userId)),
      );
    revalidatePath("/", "layout");
  }
}

export async function shareParticipant(
  participantId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await currentUserId();
  if (!userId || !(await userOwnsParticipant(participantId, userId))) {
    return { ok: false, message: "Not allowed." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { ok: false, errors: { email: "Enter an email" } };

  const recipient = await findActiveUserByEmail(email);
  if (!recipient) {
    return {
      ok: false,
      message: `${email} isn't a registered, activated user yet — they need to sign up before you can share with them.`,
    };
  }
  if (recipient.id === userId) {
    return { ok: false, message: "You already have full access." };
  }

  const flags: ShareFlags = {
    dob: formData.get("share_dob") != null,
    mood: formData.get("share_mood") != null,
    appetite: formData.get("share_appetite") != null,
    energy: formData.get("share_energy") != null,
    notes: formData.get("share_notes") != null,
  };

  const { created, token } = await createOrUpdateShare(
    participantId,
    recipient.id,
    flags,
  );

  if (created) {
    const [{ name }] = await db
      .select({ name: participants.name })
      .from(participants)
      .where(eq(participants.id, participantId))
      .limit(1);
    const host = (await headers()).get("host");
    const proto = host?.startsWith("localhost") ? "http" : "https";
    const base = process.env.AUTH_URL ?? `${proto}://${host}`;
    const me = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { email: true },
    });
    await sendShareInviteEmail(
      email,
      me?.email ?? "A Mounjaro Tracker user",
      name,
      `${base}/shares/accept?token=${token}`,
    );
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: created
      ? `Invitation sent to ${email}.`
      : `Updated what's shared with ${email}.`,
  };
}

export async function revokeShareAction(formData: FormData) {
  const userId = await currentUserId();
  const shareId = String(formData.get("shareId") ?? "");
  if (userId && shareId) {
    await revokeShare(shareId, userId);
    revalidatePath("/", "layout");
  }
}
