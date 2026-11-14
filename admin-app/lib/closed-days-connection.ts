import { createHash } from "node:crypto";
export const shopCalendarId = "bpi41sabm94gp0sni0ps7vajkc@group.calendar.google.com";
export function closedDaysConnection(env = process.env) {
  const id = env.GOOGLE_CALENDAR_ID?.trim();
  const writer = env.GOOGLE_CALENDAR_WRITE_SERVICE_ACCOUNT_JSON ||
    (env.GOOGLE_CALENDAR_CLOSED_DAYS_USE_EXISTING_ACCOUNT === "true" ? env.GOOGLE_CALENDAR_READ_SERVICE_ACCOUNT_JSON : undefined);
  const reader = env.GOOGLE_CALENDAR_READ_SERVICE_ACCOUNT_JSON || writer;
  let verifiedAccount = false;
  try {
    const account = JSON.parse(writer || "null");
    verifiedAccount = Boolean(account?.client_email && account?.private_key && env.GOOGLE_CALENDAR_CLOSED_DAYS_ACCOUNT_FINGERPRINT &&
      createHash("sha256").update(account.client_email).digest("hex") === env.GOOGLE_CALENDAR_CLOSED_DAYS_ACCOUNT_FINGERPRINT);
  } catch { /* Missing configuration must never enable writes. */ }
  const correctTarget = Boolean(id && (env.VERCEL_ENV !== "production" || id === shopCalendarId));
  const writable = env.GOOGLE_CALENDAR_CLOSED_DAYS_ENABLED === "true" && verifiedAccount && correctTarget && env.VERCEL_ENV !== "preview";
  return { id: correctTarget ? id : undefined, writer, reader, writable, verifiedAccount };
}
