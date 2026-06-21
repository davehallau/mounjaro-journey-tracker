"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function authenticate(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // signIn throws a redirect on success — let that propagate.
    if (error instanceof AuthError) {
      return "Invalid username or password.";
    }
    throw error;
  }
  return undefined;
}
