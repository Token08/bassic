// Vercel build preflight: inspect secrets only in memory and make read-only calls.
import { createHash, createSign } from "node:crypto";
if (process.env.GOOGLE_CALENDAR_CLOSED_DAYS_ENABLED === "true") {
  try {
    const writer = process.env.GOOGLE_CALENDAR_WRITE_SERVICE_ACCOUNT_JSON ||
      (process.env.GOOGLE_CALENDAR_CLOSED_DAYS_USE_EXISTING_ACCOUNT === "true" ? process.env.GOOGLE_CALENDAR_READ_SERVICE_ACCOUNT_JSON : "");
    const config = JSON.parse(writer || "null");
    const id = process.env.GOOGLE_CALENDAR_ID;
    if (!config?.client_email || !config?.private_key || createHash("sha256").update(config.client_email).digest("hex") !== process.env.GOOGLE_CALENDAR_CLOSED_DAYS_ACCOUNT_FINGERPRINT ||
        id !== "bpi41sabm94gp0sni0ps7vajkc@group.calendar.google.com") throw Error();
    const issued = Math.floor(Date.now() / 1000), tokenUrl = "https://oauth2.googleapis.com/token";
    const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
    const assertion = [encode({ alg: "RS256", typ: "JWT" }), encode({ iss: config.client_email, scope: "https://www.googleapis.com/auth/calendar.events.readonly", aud: tokenUrl, iat: issued, exp: issued + 300 })].join(".");
    const signature = createSign("RSA-SHA256").update(assertion).sign(config.private_key).toString("base64url");
    const auth = await fetch(tokenUrl, { method: "POST", redirect: "error", signal: AbortSignal.timeout(8000), body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: assertion + "." + signature }) });
    if (!auth.ok) throw Error();
    const { access_token } = await auth.json();
    if (typeof access_token !== "string" || !access_token) throw Error();
    const month = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
    const query = new URLSearchParams({ timeMin: month + "-01T00:00:00+09:00", maxResults: "1", singleEvents: "true" });
    const read = await fetch("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(id) + "/events?" + query, { headers: { Authorization: "Bearer " + access_token }, redirect: "error", signal: AbortSignal.timeout(8000) });
    if (!read.ok || !Array.isArray((await read.json()).items)) throw Error();
    console.log("Closed-day connection matches the verified store account. Store read-only check passed; no writes performed.");
  } catch {
    // Never include provider error objects, credential values or request headers.
    throw Error("Store calendar validation failed; this deployment must not be promoted.");
  }
}
