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
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    throw new Error(`Email send failed (${res.status}): ${await res.text()}`);
  }
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
