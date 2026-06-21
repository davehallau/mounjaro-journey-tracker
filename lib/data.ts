import { cookies } from "next/headers";
import { and, asc, eq } from "drizzle-orm";
import { db } from "./db";
import { doses, participants, recordings, shares } from "./db/schema";
import type { Participant } from "./db/schema";
import { calcBmi } from "./bmi";
import { auth } from "@/auth";

const ACTIVE_COOKIE = "activeParticipant";

/** The signed-in user's id (our users.id), or null. */
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

// Which optional fields a viewer may see. Owners see everything.
export type ShareFields = {
  dob: boolean;
  mood: boolean;
  appetite: boolean;
  energy: boolean;
  notes: boolean;
};
const OWNER_FIELDS: ShareFields = {
  dob: true,
  mood: true,
  appetite: true,
  energy: true,
  notes: true,
};
const fieldsFromShare = (s: typeof shares.$inferSelect): ShareFields => ({
  dob: s.shareDob,
  mood: s.shareMood,
  appetite: s.shareAppetite,
  energy: s.shareEnergy,
  notes: s.shareNotes,
});

// Participant as exposed to the client — dob is nulled out when not shared.
export type ParticipantView = Omit<Participant, "dob"> & { dob: string | null };

export type AccessibleParticipant = {
  participant: ParticipantView;
  access: "owner" | "shared";
  fields: ShareFields;
};

function sanitizeParticipant(
  p: Participant,
  fields: ShareFields,
): ParticipantView {
  return { ...p, dob: fields.dob ? p.dob : null };
}

/** Participants the user owns (for the management list). */
export async function listOwnedParticipants(
  userId: string,
): Promise<Participant[]> {
  return db
    .select()
    .from(participants)
    .where(eq(participants.ownerUserId, userId))
    .orderBy(asc(participants.name));
}

/** Everything the user can view: owned + accepted shares (field-gated). */
export async function listAccessibleParticipants(
  userId: string,
): Promise<AccessibleParticipant[]> {
  const owned = await listOwnedParticipants(userId);
  const sharedRows = await db
    .select({ p: participants, s: shares })
    .from(shares)
    .innerJoin(participants, eq(shares.participantId, participants.id))
    .where(
      and(
        eq(shares.recipientUserId, userId),
        eq(shares.status, "accepted"),
      ),
    );

  const result: AccessibleParticipant[] = [
    ...owned.map((p) => ({
      participant: p as ParticipantView,
      access: "owner" as const,
      fields: OWNER_FIELDS,
    })),
    ...sharedRows.map(({ p, s }) => {
      const fields = fieldsFromShare(s);
      return {
        participant: sanitizeParticipant(p, fields),
        access: "shared" as const,
        fields,
      };
    }),
  ];
  return result.sort((a, b) =>
    a.participant.name.localeCompare(b.participant.name),
  );
}

/** A single participant the user owns (for editing). */
export async function getOwnedParticipant(
  id: string,
): Promise<Participant | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const rows = await db
    .select()
    .from(participants)
    .where(and(eq(participants.id, id), eq(participants.ownerUserId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/** The active participant (cookie, falling back to the first accessible one). */
export async function getActiveParticipant(): Promise<AccessibleParticipant | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const all = await listAccessibleParticipants(userId);
  if (all.length === 0) return null;
  const selected = (await cookies()).get(ACTIVE_COOKIE)?.value;
  return all.find((a) => a.participant.id === selected) ?? all[0];
}

export async function setActiveParticipantCookie(id: string): Promise<void> {
  (await cookies()).set(ACTIVE_COOKIE, id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

/** True if the user owns this participant (for guarding mutations). */
export async function userOwnsParticipant(
  participantId: string,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: participants.id })
    .from(participants)
    .where(
      and(
        eq(participants.id, participantId),
        eq(participants.ownerUserId, userId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export type RecordingView = {
  id: string;
  recordedOn: string;
  weightKg: number;
  waistCm: number | null;
  mood: number | null;
  energy: number | null;
  appetite: number | null;
  notes: string | null;
  bmi: number;
};

export type DoseView = {
  id: string;
  recordedOn: string;
  medication: string;
  doseMg: number | null;
};

/** Dose administrations for a participant (oldest first). */
export async function getDoses(participantId: string): Promise<DoseView[]> {
  const rows = await db
    .select()
    .from(doses)
    .where(eq(doses.participantId, participantId))
    .orderBy(asc(doses.recordedOn));
  return rows.map((d) => ({
    id: d.id,
    recordedOn: d.recordedOn,
    medication: d.medication,
    doseMg: d.doseMg == null ? null : Number(d.doseMg),
  }));
}

const num = (v: string | null): number | null => (v == null ? null : Number(v));

/**
 * Recordings for a participant, with non-shared fields stripped server-side
 * (they never reach the client). Pass the viewer's field permissions.
 */
export async function getRecordings(
  participantId: string,
  heightCm: number,
  fields: ShareFields = OWNER_FIELDS,
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
      mood: fields.mood ? r.mood : null,
      energy: fields.energy ? r.energy : null,
      appetite: fields.appetite ? r.appetite : null,
      notes: fields.notes ? r.notes : null,
      bmi: calcBmi(weight, heightCm),
    };
  });
}

/** A dose for editing — only if the current user owns its participant. */
export async function getDose(
  id: string,
): Promise<typeof doses.$inferSelect | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const rows = await db
    .select({ d: doses })
    .from(doses)
    .innerJoin(participants, eq(doses.participantId, participants.id))
    .where(and(eq(doses.id, id), eq(participants.ownerUserId, userId)))
    .limit(1);
  return rows[0]?.d ?? null;
}

/** A recording for editing — only if the current user owns its participant. */
export async function getRecording(
  id: string,
): Promise<typeof recordings.$inferSelect | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const rows = await db
    .select({ r: recordings })
    .from(recordings)
    .innerJoin(participants, eq(recordings.participantId, participants.id))
    .where(and(eq(recordings.id, id), eq(participants.ownerUserId, userId)))
    .limit(1);
  return rows[0]?.r ?? null;
}
