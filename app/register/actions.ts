"use server";

import { redirect } from "next/navigation";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sendActivationEmail } from "@/lib/email";
import {
  fieldErrors,
  formToObject,
  registerSchema,
  type FormState,
} from "@/lib/validation";

export async function registerUser(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }
  const { email, password } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing?.active) {
    return {
      ok: false,
      message: "That email is already registered — try signing in.",
    };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expires = new Date(Date.now() + 30 * 60 * 1000);
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    // Re-registering an un-activated email: refresh password + code.
    await db
      .update(users)
      .set({
        passwordHash,
        active: false,
        activationCode: code,
        activationExpires: expires,
      })
      .where(eq(users.id, existing.id));
  } else {
    await db.insert(users).values({
      username: email,
      email,
      passwordHash,
      active: false,
      activationCode: code,
      activationExpires: expires,
    });
  }

  await sendActivationEmail(email, code);
  redirect(`/activate?email=${encodeURIComponent(email)}`);
}
