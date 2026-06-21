"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import { setActiveParticipantCookie } from "@/lib/data";

export async function selectParticipant(id: string) {
  if (id) await setActiveParticipantCookie(id);
  revalidatePath("/", "layout");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
