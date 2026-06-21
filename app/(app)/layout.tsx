import { AppNav } from "@/components/app-nav";
import {
  currentUserId,
  getActiveParticipant,
  listAccessibleParticipants,
} from "@/lib/data";

// These pages are per-user (cookie-based active participant) and read
// live DB data, so they must render dynamically — never statically cached.
// Applies to all nested routes (dashboard, participants, recordings).
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await currentUserId();
  const accessible = userId ? await listAccessibleParticipants(userId) : [];
  const active = await getActiveParticipant();
  const navParticipants = accessible.map((a) => ({
    id: a.participant.id,
    name: a.participant.name,
    shared: a.access === "shared",
  }));

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav
        participants={navParticipants}
        activeId={active?.participant.id ?? null}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
