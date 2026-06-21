"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  activateSchema,
  fieldErrors,
  formToObject,
  type FormState,
} from "@/lib/validation";

export async function activateUser(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = activateSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }
  const { email, code } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (user?.active) redirect("/login?activated=1");
  if (!user || user.activationCode == null) {
    return { ok: false, message: "No pending activation for that email." };
  }
  if (!user.activationExpires || user.activationExpires < new Date()) {
    return {
      ok: false,
      message: "That code has expired — register again to get a new one.",
    };
  }
  if (user.activationCode !== code) {
    return { ok: false, message: "Incorrect code. Check your email and retry." };
  }

  await db
    .update(users)
    .set({ active: true, activationCode: null, activationExpires: null })
    .where(eq(users.id, user.id));

  redirect("/login?activated=1");
}
