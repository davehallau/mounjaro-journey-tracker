// Minimal email sender. Uses Resend's REST API when RESEND_API_KEY is set
// (e.g. via the Vercel Resend integration); otherwise logs to the server so
// the activation flow is testable before an email provider is wired up.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] (no RESEND_API_KEY) to=${to} subject="${subject}"`);
    console.log(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    return;
  }
  const from = process.env.EMAIL_FROM ?? "Mounjaro Tracker <onboarding@resend.dev>";
  // Best-effort: a send failure (e.g. unverified domain) must not crash the
  // calling action. Log and move on.
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error(`Email send failed (${res.status}): ${await res.text()}`);
    }
  } catch (err) {
    console.error("Email send error:", err);
  }
}

export async function sendShareInviteEmail(
  to: string,
  sharerEmail: string,
  participantName: string,
  acceptUrl: string,
) {
  await send(
    to,
    `${sharerEmail} shared ${participantName}'s data with you`,
    `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#0f172a">
      <p><strong>${sharerEmail}</strong> has shared read-only access to
      <strong>${participantName}</strong>'s Mounjaro Tracker data with you.</p>
      <p><a href="${acceptUrl}" style="display:inline-block;background:#059669;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Accept &amp; view</a></p>
      <p style="color:#64748b">If the button doesn't work, open: ${acceptUrl}</p>
    </div>`,
  );
}

export async function sendActivationEmail(to: string, code: string) {
  await send(
    to,
    "Your Mounjaro Tracker activation code",
    `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#0f172a">
      <p>Welcome to Mounjaro Tracker 👋</p>
      <p>Your activation code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#059669">${code}</p>
      <p style="color:#64748b">Enter it on the activation screen to finish setting up your account. It expires in 30 minutes.</p>
    </div>`,
  );
}
