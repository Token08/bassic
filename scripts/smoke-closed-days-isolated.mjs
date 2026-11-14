import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(new URL("../admin-app/package.json", import.meta.url));
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const secret = "closed-day-isolated-fixture-only";
const email = "closed-days@example.invalid";
const credential = JSON.stringify({ client_email: email, private_key: privateKey.export({ format: "pem", type: "pkcs8" }) });
Object.assign(process.env, { ADMIN_PASSWORD: secret, ADMIN_SESSION_SECRET: secret, GOOGLE_CALENDAR_ID: "isolated-calendar", GOOGLE_CALENDAR_READ_SERVICE_ACCOUNT_JSON: credential,
  GOOGLE_CALENDAR_CLOSED_DAYS_ENABLED: "true", GOOGLE_CALENDAR_CLOSED_DAYS_USE_EXISTING_ACCOUNT: "true", GOOGLE_CALENDAR_CLOSED_DAYS_ACCOUNT_FINGERPRINT: createHash("sha256").update(email).digest("hex") });
delete process.env.VERCEL_ENV;
const holiday = { id: "legacy", etag: '"original"', summary: "店休日", start: { date: "2026-12-01" }, end: { date: "2026-12-04" } };
const live = { ...holiday, id: "live", summary: "Live show" };
const items = new Map([[holiday.id, holiday], [live.id, live]]);
let writes = 0, unavailable = false;
const scopes = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.hostname === "127.0.0.1") return originalFetch(input, init);
  if (url.hostname === "oauth2.googleapis.com") {
    const assertion = new URLSearchParams(init.body).get("assertion");
    scopes.push(JSON.parse(Buffer.from(assertion.split(".")[1], "base64url")).scope);
    return Response.json({ access_token: "isolated-token" });
  }
  assert.equal(url.hostname, "www.googleapis.com", "No real provider may be contacted");
  assert.ok(url.pathname.startsWith("/calendar/v3/calendars/isolated-calendar/events"), "Never accept a client calendar ID");
  if (unavailable) return new Response(null, { status: 503 });
  const id = url.pathname.split("/")[6];
  const method = init.method || "GET";
  if (method === "GET" && id) {
    const item = items.get(id);
    return !item ? new Response(null, { status: 404 }) : item.status === "cancelled" ? new Response(null, { status: 410 }) : Response.json(item);
  }
  if (method === "GET") {
    assert.equal(url.searchParams.get("singleEvents"), "true");
    const from = url.searchParams.get("timeMin").slice(0, 10), until = url.searchParams.get("timeMax").slice(0, 10);
    return Response.json({ items: [...items.values()].filter(e => e.status !== "cancelled" && e.start.date < until && e.end.date > from) });
  }
  if (method === "POST") {
    const body = JSON.parse(init.body);
    if (items.has(body.id)) return new Response(null, { status: 409 });
    const item = { ...body, etag: '"' + ++writes + '"' }; items.set(item.id, item); return Response.json(item, { status: 201 });
  }
  assert.equal(method, "DELETE"); assert.equal(url.searchParams.get("sendUpdates"), "none");
  const current = items.get(id);
  if (new Headers(init.headers).get("If-Match") !== current.etag) return new Response(null, { status: 412 });
  items.set(id, { ...current, status: "cancelled", etag: '"' + ++writes + '"' }); return new Response(null, { status: 204 });
};
const app = require("next")({ dev: false, dir: fileURLToPath(new URL("../admin-app/", import.meta.url)) });
const server = createServer(app.getRequestHandler());
try {
  await app.prepare(); await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  let cookie = "";
  async function call(path, body, expected = 200) {
    const response = await originalFetch(base + "/api/" + path, { method: body ? "POST" : "GET", headers: { Cookie: cookie, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json(); assert.equal(response.status, expected, JSON.stringify(data)); return { data: data.data, response };
  }
  await call("closed-days?month=2026-12", null, 401);
  await call("closed-days", { changes: [] }, 401);
  cookie = (await call("login", { password: secret })).response.headers.get("set-cookie").split(";")[0];
  const month = (await call("closed-days?month=2026-12")).data;
  assert.equal(month.canWrite, true); assert.equal(month.events.length, 2); assert.equal(month.events.find(e => e.id === "live").editable, false);
  assert.equal(scopes.at(-1), "https://www.googleapis.com/auth/calendar.events.readonly");
  await call("closed-days", { operation: randomUUID(), changes: [{ date: "2026-02-30", action: "add", events: [] }] }, 400);
  const body = { operation: randomUUID(), calendarId: "forbidden-personal-calendar", changes: [{ date: "2026-12-02", action: "remove", events: [month.events.find(e => e.id === "legacy")] }, { date: "2026-12-31", action: "add", events: [] }] };
  const result = (await call("closed-days", body)).data;
  assert.ok(result.results.every(r => r.state === "applied"));
  assert.equal(scopes.at(-1), "https://www.googleapis.com/auth/calendar.events");
  const before = writes; await call("closed-days", body); assert.equal(writes, before);
  assert.equal(items.get("live").summary, "Live show");
  process.env.VERCEL_ENV = "preview"; await call("closed-days", body, 403); assert.equal(writes, before); delete process.env.VERCEL_ENV;
  process.env.GOOGLE_CALENDAR_CLOSED_DAYS_ACCOUNT_FINGERPRINT = "wrong"; await call("closed-days", body, 403); assert.equal(writes, before);
  unavailable = true; await call("closed-days?month=2026-12", null, 502);
  console.log("Closed-day API isolation passed: authentication, calendar target, snapshots, readback, retry, preview gate, account identity and read failures.");
} finally { globalThis.fetch = originalFetch; await new Promise(resolve => server.close(resolve)); await app.close(); }
