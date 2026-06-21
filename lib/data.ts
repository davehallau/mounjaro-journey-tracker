import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import { participants, recordings } from "./db/schema";
import type { Participant } from "./db/schema";
import { calcBmi } from "./bmi";

const ACTIVE_COOKIE = "activeParticipant";

export async function listParticipants(): Promise<Participant[]> {
  return db.select().from(participants).orderBy(asc(participants.name));
}

export async function getParticipant(id: string): Promise<Participant | null> {
  const rows = await db
    .select()
    .from(participants)
    .where(eq(participants.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** The participant currently selected via cookie, falling back to the first. */
export async function getActiveParticipant(): Promise<Participant | null> {
  const all = await listParticipants();
  if (all.length === 0) return null;
  const selected = (await cookies()).get(ACTIVE_COOKIE)?.value;
  return all.find((p) => p.id === selected) ?? all[0];
}

export async function setActiveParticipantCookie(id: string): Promise<void> {
  (await cookies()).set(ACTIVE_COOKIE, id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export type RecordingView = {
  id: string;
  recordedOn: string;
  weightKg: number;
  waistCm: number | null;
  mood: number | null;
  energy: number | null;
  appetite: number | null;
  medication: string | null;
  mounjaroDoseMg: number | null;
  notes: string | null;
  bmi: number;
};

const num = (v: string | null): number | null => (v == null ? null : Number(v));

export async function getRecordings(
  participantId: string,
  heightCm: number,
): Promise<RecordingView[]> {
  const rows = await db
    .select()
    .from(recordings)
    .where(eq(recordings.participantId, participantId))
    .orderBy(asc(recordings.recordedOn));

  return rows.map((r) => {
    const weight = Number(r.weightKg);
    return {
      id: r.id,
      recordedOn: r.recordedOn,
      weightKg: weight,
      waistCm: num(r.waistCm),
      mood: r.mood,
      energy: r.energy,
      appetite: r.appetite,
      medication: r.medication,
      mounjaroDoseMg: num(r.mounjaroDoseMg),
      notes: r.notes,
      bmi: calcBmi(weight, heightCm),
    };
  });
}

export async function getRecording(
  id: string,
): Promise<typeof recordings.$inferSelect | null> {
  const rows = await db
    .select()
    .from(recordings)
    .where(eq(recordings.id, id))
    .limit(1);
  return rows[0] ?? null;
}
