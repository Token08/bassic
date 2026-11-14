// Explicit live test: write only to a private disposable calendar; store reads use a read-only token.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { google } from "googleapis";
import { calendarAccess } from "../admin-app/lib/closed-days-google.ts";
import { applyClosedDays, dayEvent } from "../admin-app/lib/closed-days.ts";
const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!json) throw Error("An existing store service account is required.");
const credentials = JSON.parse(json);
const auth = new google.auth.JWT({ email: credentials.client_email, key: credentials.private_key, scopes: ["https://www.googleapis.com/auth/calendar"] });
const api = google.calendar({ version: "v3", auth });
const productionId = "bpi41sabm94gp0sni0ps7vajkc@group.calendar.google.com";
let disposableId;
try {
  const { data: created } = await api.calendars.insert({ requestBody: { summary: "Bassic closed-days QA " + randomUUID(), timeZone: "Asia/Tokyo" } });
  assert.ok(created.id && created.id !== productionId && created.id !== process.env.GOOGLE_CALENDAR_ID);
  disposableId = created.id;
  const access = await calendarAccess(json, disposableId, true);
  const run = (changes, operation = randomUUID(), gateway = access) => applyClosedDays(gateway, disposableId, changes, operation);
  const add = date => ({ date, action: "add", events: [] });
  const remove = (date, event) => ({ date, action: "remove", events: [dayEvent(event)] });
  const insert = (title, start, end, extra = {}) => access.insert({ id: "qt" + randomUUID().replaceAll("-", ""), summary: title, start: { date: start }, end: { date: end }, ...extra });
  const live = await insert("Live show", "2027-02-10", "2027-02-11");
  for (const date of ["2027-02-10", "2027-02-28", "2027-03-01"]) assert.equal((await run([add(date)]))[0].state, "applied");
  assert.equal((await run([add("2027-02-10")]))[0].state, "applied");
  let holidays = (await access.list("2027-02-10", "2027-02-11")).filter(e => e.summary === "店休日");
  assert.equal(holidays.length, 1);
  assert.equal((await run([remove("2027-02-10", holidays[0])]))[0].state, "applied");
  assert.equal((await run([add("2027-02-10")]))[0].state, "applied", "Adding after deletion must use a new Google ID");
  const old = await insert("定休日", "2027-04-01", "2027-04-04", { description: "Keep this note" });
  const operation = randomUUID(), change = [remove("2027-04-02", old)];
  let fail = true;
  const flaky = { list: (...a) => access.list(...a), get: (...a) => access.get(...a), insert: (...a) => access.insert(...a), remove: (...a) => {
    if (a[0] === old.id && fail) throw Error("isolated simulated outage"); return access.remove(...a);
  } };
  assert.equal((await run(change, operation, flaky))[0].state, "failed");
  assert.deepEqual((await access.list("2027-04-01", "2027-04-04")).map(e => e.id), [old.id], "Failed splits must roll back their own copies");
  fail = false;
  assert.equal((await run(change, operation, flaky))[0].state, "applied");
  assert.equal((await run(change, operation))[0].state, "applied");
  const retained = await access.list("2027-04-01", "2027-04-04");
  assert.deepEqual(retained.map(e => [e.start.date, e.end.date]).sort(), [["2027-04-01", "2027-04-02"], ["2027-04-03", "2027-04-04"]]);
  assert.ok(retained.every(e => e.description === "Keep this note"));
  const parent = await insert("定休日", "2027-05-01", "2027-05-02", { recurrence: ["RRULE:FREQ=WEEKLY;COUNT=3"] });
  const instances = (await access.list("2027-05-01", "2027-05-31")).filter(e => e.recurringEventId === parent.id);
  assert.equal(instances.length, 3);
  assert.equal((await run([remove(instances[0].start.date, instances[0])]))[0].state, "applied");
  assert.equal((await access.list("2027-05-01", "2027-05-31")).filter(e => e.recurringEventId === parent.id).length, 2);
  assert.equal((await access.get(parent.id)).status, "confirmed");
  const changed = await insert("店休日", "2027-06-01", "2027-06-02");
  await api.events.patch({ calendarId: disposableId, eventId: changed.id, requestBody: { description: "Changed by another staff member" } });
  assert.equal((await run([remove("2027-06-01", changed)]))[0].state, "conflict");
  assert.equal((await access.get(live.id)).summary, "Live show");
  const storeReader = await calendarAccess(json, productionId, false);
  const month = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
  const from = month + "-01";
  const until = new Date(Date.parse(month + "-28T00:00:00Z") + 4 * 86400000).toISOString().slice(0, 8) + "01";
  const visibleStoreEvents = await storeReader.list(from, until);
  assert.ok(Array.isArray(visibleStoreEvents));
  console.log("Store calendar read-only connection verified. Store write calls: 0.");
  console.log("Private calendar: add, retry, remove, re-add, split rollback, recurrence exception and ETag conflict passed.");
  console.log("VERIFIED_ACCOUNT_FINGERPRINT=" + createHash("sha256").update(credentials.client_email).digest("hex"));
} catch (error) {
  // Google client errors may contain request headers. Never log the raw object.
  console.error("Private calendar QA failed: " + (error instanceof Error ? error.message : "provider error"));
  process.exitCode = 1;
} finally {
  if (disposableId && disposableId !== productionId && disposableId !== process.env.GOOGLE_CALENDAR_ID) {
    try {
      await api.calendars.delete({ calendarId: disposableId });
      console.log("Disposed only the private calendar created by this test.");
    } catch (error) {
      console.error("Private calendar cleanup needs review: " + (error instanceof Error ? error.message : "provider error"));
      process.exitCode = 1;
    }
  }
}
