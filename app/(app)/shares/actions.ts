"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUserId, setActiveParticipantCookie } from "@/lib/data";
import { acceptShare } from "@/lib/shares";

export async function acceptShareAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const userId = await currentUserId();
  if (!token || !userId) redirect("/dashboard");

  const participantId = await acceptShare(token, userId);
  if (participantId) {
    await setActiveParticipantCookie(participantId);
    revalidatePath("/", "layout");
  }
  redirect("/dashboard");
}
