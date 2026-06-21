import { AppNav } from "@/components/app-nav";
import { getActiveParticipant, listParticipants } from "@/lib/data";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [participants, active] = await Promise.all([
    listParticipants(),
    getActiveParticipant(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav participants={participants} activeId={active?.id ?? null} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
