import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ activated?: string }>;
}) {
  const activated = (await searchParams).activated != null;
  const providers = {
    google: Boolean(process.env.AUTH_GOOGLE_ID),
    microsoft: Boolean(process.env.AUTH_MICROSOFT_ENTRA_ID_ID),
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Mounjaro Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to view your progress
          </p>
        </div>
        <div className="card">
          {activated && (
            <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Account activated — sign in to continue.
            </p>
          )}
          <LoginForm providers={providers} />
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{" "}
          <Link
            href="/register"
            className="font-medium text-emerald-700 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
