import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Weight Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to view your progress
          </p>
        </div>
        <div className="card">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
