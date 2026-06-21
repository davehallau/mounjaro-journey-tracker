import type { Metadata } from "next";
import Link from "next/link";
import { ActivateForm } from "@/components/activate-form";

export const metadata: Metadata = { title: "Activate account" };

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const email = (await searchParams).email ?? "";

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Activate your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the 6-digit code we emailed you
          </p>
        </div>
        <div className="card">
          <ActivateForm email={email} />
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          Didn&apos;t get it?{" "}
          <Link
            href="/register"
            className="font-medium text-emerald-700 hover:underline"
          >
            Register again
          </Link>
        </p>
      </div>
    </main>
  );
}
