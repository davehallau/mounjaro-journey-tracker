"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/(app)/actions";
import {
  ParticipantSwitcher,
  type NavParticipant,
} from "@/components/participant-switcher";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recordings", label: "Recordings" },
  { href: "/participants", label: "Participants" },
];

export function AppNav({
  participants,
  activeId,
}: {
  participants: NavParticipant[];
  activeId: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
            <span className="text-emerald-600">●</span> Weight Tracker
          </Link>
          <form action={signOutAction} className="sm:hidden">
            <button className="text-sm text-slate-500 hover:text-slate-800">
              Sign out
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ParticipantSwitcher participants={participants} activeId={activeId} />

          <nav className="flex items-center gap-1">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <form action={signOutAction} className="hidden sm:block">
            <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
