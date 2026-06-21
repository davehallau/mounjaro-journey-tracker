import { randomBytes } from "crypto";
import { and, asc, eq } from "drizzle-orm";
import { db } from "./db";
import { participants, shares, users } from "./db/schema";

export type ShareFlags = {
  dob: boolean;
  mood: boolean;
  appetite: boolean;
  energy: boolean;
  notes: boolean;
};

export async function findActiveUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: and(eq(users.email, email.toLowerCase()), eq(users.active, true)),
  });
}

export type ShareRow = {
  id: string;
  status: string;
  recipientEmail: string | null;
  flags: ShareFlags;
};

export async function listSharesForParticipant(
  participantId: string,
): Promise<ShareRow[]> {
  const rows = await db
    .select({
      id: shares.id,
      status: shares.status,
      recipientEmail: users.email,
      dob: shares.shareDob,
      mood: shares.shareMood,
      appetite: shares.shareAppetite,
      energy: shares.shareEnergy,
      notes: shares.shareNotes,
    })
    .from(shares)
    .innerJoin(users, eq(shares.recipientUserId, users.id))
    .where(eq(shares.participantId, participantId))
    .orderBy(asc(users.email));
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    recipientEmail: r.recipientEmail,
    flags: {
      dob: r.dob,
      mood: r.mood,
      appetite: r.appetite,
      energy: r.energy,
      notes: r.notes,
    },
  }));
}

/** Create a pending share, or update field flags on an existing one. */
export async function createOrUpdateShare(
  participantId: string,
  recipientUserId: string,
  flags: ShareFlags,
): Promise<{ created: boolean; token: string }> {
  const existing = await db
    .select()
    .from(shares)
    .where(
      and(
        eq(shares.participantId, participantId),
        eq(shares.recipientUserId, recipientUserId),
      ),
    )
    .limit(1);

  const flagValues = {
    shareDob: flags.dob,
    shareMood: flags.mood,
    shareAppetite: flags.appetite,
    shareEnergy: flags.energy,
    shareNotes: flags.notes,
  };

  if (existing[0]) {
    await db
      .update(shares)
      .set(flagValues)
      .where(eq(shares.id, existing[0].id));
    return { created: false, token: existing[0].token };
  }

  const token = randomBytes(24).toString("hex");
  await db.insert(shares).values({
    participantId,
    recipientUserId,
    status: "pending",
    token,
    ...flagValues,
  });
  return { created: true, token };
}

/** Delete a share, but only if the requester owns the participant. */
export async function revokeShare(
  shareId: string,
  ownerUserId: string,
): Promise<void> {
  const rows = await db
    .select({ id: shares.id })
    .from(shares)
    .innerJoin(participants, eq(shares.participantId, participants.id))
    .where(
      and(eq(shares.id, shareId), eq(participants.ownerUserId, ownerUserId)),
    )
    .limit(1);
  if (rows[0]) await db.delete(shares).where(eq(shares.id, shareId));
}

/** Look up a share by its invite token (to show the recipient what it is). */
export async function getShareByToken(token: string) {
  const rows = await db
    .select({
      id: shares.id,
      status: shares.status,
      recipientUserId: shares.recipientUserId,
      participantName: participants.name,
    })
    .from(shares)
    .innerJoin(participants, eq(shares.participantId, participants.id))
    .where(eq(shares.token, token))
    .limit(1);
  return rows[0] ?? null;
}

/** Accept a pending share addressed to this user; returns the participant id. */
export async function acceptShare(
  token: string,
  userId: string,
): Promise<string | null> {
  const rows = await db
    .select()
    .from(shares)
    .where(and(eq(shares.token, token), eq(shares.recipientUserId, userId)))
    .limit(1);
  if (!rows[0]) return null;
  await db
    .update(shares)
    .set({ status: "accepted" })
    .where(eq(shares.id, rows[0].id));
  return rows[0].participantId;
}
