import Link from "next/link";
import { currentUserId } from "@/lib/data";
import { getShareByToken } from "@/lib/shares";
import { acceptShareAction } from "../actions";

export const metadata = { title: "Accept shared access" };

export default async function AcceptSharePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";
  const userId = await currentUserId();
  const share = token ? await getShareByToken(token) : null;
  const valid = share != null && share.recipientUserId === userId;

  return (
    <div className="mx-auto max-w-md">
      <div className="card text-center">
        {!valid ? (
          <>
            <h1 className="text-lg font-semibold text-slate-900">
              Invite not found
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              This invite link is invalid, or it was sent to a different
              account. Make sure you&apos;re signed in with the invited email.
            </p>
            <Link href="/dashboard" className="btn-secondary mt-4 inline-flex">
              Back to dashboard
            </Link>
          </>
        ) : share.status === "accepted" ? (
          <>
            <h1 className="text-lg font-semibold text-slate-900">
              Already accepted
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              You already have read-only access to{" "}
              <strong>{share.participantName}</strong>.
            </p>
            <Link href="/dashboard" className="btn-primary mt-4 inline-flex">
              View dashboard
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-slate-900">
              Accept shared access?
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              You&apos;ve been given read-only access to{" "}
              <strong>{share.participantName}</strong>&apos;s data.
            </p>
            <form action={acceptShareAction} className="mt-4">
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn-primary w-full">
                Accept &amp; view
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
