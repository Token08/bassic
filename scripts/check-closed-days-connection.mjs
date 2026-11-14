// Run before the Vercel build. The secret is inspected in memory, never printed.
import { createHash } from "node:crypto";
if (process.env.GOOGLE_CALENDAR_CLOSED_DAYS_ENABLED === "true") {
  const writer = process.env.GOOGLE_CALENDAR_WRITE_SERVICE_ACCOUNT_JSON ||
    (process.env.GOOGLE_CALENDAR_CLOSED_DAYS_USE_EXISTING_ACCOUNT === "true" ? process.env.GOOGLE_CALENDAR_READ_SERVICE_ACCOUNT_JSON : "");
  const config = JSON.parse(writer || "null");
  if (!config?.client_email || !config?.private_key || createHash("sha256").update(config.client_email).digest("hex") !== process.env.GOOGLE_CALENDAR_CLOSED_DAYS_ACCOUNT_FINGERPRINT ||
      process.env.GOOGLE_CALENDAR_ID !== "bpi41sabm94gp0sni0ps7vajkc@group.calendar.google.com") throw Error("Store calendar connection does not match the verified test account.");
  console.log("Closed-day connection matches the verified store account.");
}
