import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { applyClosedDays, dayEvent, editableClosedDay, monthRange } from "../admin-app/lib/closed-days.ts";
class MemoryCalendar {
  items = new Map(); writes = 0; before = () => {}; after = () => {};
  constructor(events = []) { for (const event of events) this.items.set(event.id, structuredClone(event)); }
  async get(id) { this.before("get", id); return structuredClone(this.items.get(id) || null); }
  async list(from, until) { this.before("list", from); return [...this.items.values()].filter(e => e.status !== "cancelled" && e.start.date < until && e.end.date > from).map(e => structuredClone(e)); }
  async insert(body) {
    this.before("insert", body.id);
    if (this.items.has(body.id)) throw Object.assign(Error("duplicate"), { status: 409 });
    const event = { ...structuredClone(body), etag: '"' + ++this.writes + '"' };
    this.items.set(body.id, event); this.after("insert", body.id); return structuredClone(event);
  }
  async remove(id, etag) {
    this.before("remove", id);
    const event = this.items.get(id);
    if (!event || event.status === "cancelled") return;
    if (event.etag !== etag) throw Object.assign(Error("changed"), { status: 412 });
    this.items.set(id, { ...event, status: "cancelled", etag: '"' + ++this.writes + '"' }); this.after("remove", id);
  }
}
const holiday = (id, from = "2026-12-01", until = "2026-12-02", extra = {}) => ({ id, etag: '"old"', summary: "店休日", start: { date: from }, end: { date: until }, ...extra });
const add = date => ({ date, action: "add", events: [] });
const remove = (date, ...events) => ({ date, action: "remove", events: events.map(dayEvent) });
const run = (calendar, changes, operation = randomUUID()) => applyClosedDays(calendar, "isolated-calendar", changes, operation);

test("concurrent/retried adds are unique; cancelled IDs can be added again", async () => {
  const cal = new MemoryCalendar();
  const change = [add("2026-12-01")];
  const results = await Promise.all([run(cal, change), run(cal, change)]);
  assert.ok(results.every(r => r[0].state === "applied"));
  let active = await cal.list("2026-12-01", "2026-12-02"); assert.equal(active.length, 1);
  assert.equal((await run(cal, [remove("2026-12-01", active[0])]))[0].state, "applied");
  assert.equal((await run(cal, change))[0].state, "applied");
  active = await cal.list("2026-12-01", "2026-12-02"); assert.equal(active.length, 1);
  assert.equal(cal.items.size, 2, "A deleted ID must never be reused");
});
test("a lost insert reply is verified rather than duplicated", async () => {
  const cal = new MemoryCalendar(); let once = true;
  cal.after = kind => { if (kind === "insert" && once) { once = false; throw Error("response lost"); } };
  assert.equal((await run(cal, [add("2026-12-01")]))[0].state, "applied");
  assert.equal(cal.writes, 1);
});
test("middle day of a legacy holiday is removed while notes and other days remain", async () => {
  const original = holiday("legacy", "2026-12-01", "2026-12-04", { summary: "定休日", description: "Original note", colorId: "4" });
  const cal = new MemoryCalendar([original]); const operation = randomUUID(); const changes = [remove("2026-12-02", original)];
  assert.equal((await run(cal, changes, operation))[0].state, "applied");
  const active = await cal.list("2026-12-01", "2026-12-04");
  assert.deepEqual(active.map(e => [e.start.date, e.end.date]).sort(), [["2026-12-01", "2026-12-02"], ["2026-12-03", "2026-12-04"]]);
  assert.ok(active.every(e => e.description === "Original note" && e.colorId === "4"));
  const writes = cal.writes;
  assert.equal((await run(cal, changes, operation))[0].state, "applied"); assert.equal(cal.writes, writes);
});
test("a failed split is rolled back without losing original dates, and can be retried", async () => {
  const original = holiday("legacy", "2026-12-01", "2026-12-04");
  const cal = new MemoryCalendar([original]); let fail = true;
  cal.before = (kind, id) => { if (kind === "remove" && id === "legacy" && fail) throw Error("unavailable"); };
  const changes = [remove("2026-12-02", original)], op = randomUUID();
  assert.equal((await run(cal, changes, op))[0].state, "failed");
  assert.deepEqual((await cal.list("2026-12-01", "2026-12-04")).map(e => e.id), ["legacy"]);
  fail = false;
  assert.equal((await run(cal, changes, op))[0].state, "applied");
  assert.equal((await cal.list("2026-12-01", "2026-12-04")).length, 2);
});
test("lost delete response succeeds only after verifying the original and retained dates", async () => {
  const original = holiday("legacy", "2026-12-01", "2026-12-04"); const cal = new MemoryCalendar([original]);
  cal.after = (kind, id) => { if (kind === "remove" && id === "legacy") throw Error("lost delete reply"); };
  assert.equal((await run(cal, [remove("2026-12-02", original)]))[0].state, "applied");
  assert.equal((await cal.list("2026-12-01", "2026-12-04")).length, 2);
});
test("recurring instance removal leaves other instances and the series alone", async () => {
  const instance = holiday("series_20261201", undefined, undefined, { recurringEventId: "series" });
  const parent = holiday("series", undefined, undefined, { recurrence: ["RRULE:FREQ=WEEKLY"] });
  const next = holiday("series_20261208", "2026-12-08", "2026-12-09", { recurringEventId: "series" });
  const cal = new MemoryCalendar([instance, next]);
  assert.equal((await run(cal, [remove("2026-12-01", instance)]))[0].state, "applied");
  assert.equal((await cal.get(next.id)).status, undefined);
  assert.equal(editableClosedDay(parent), false, "A forged series-parent ID must not delete all occurrences");
});
test("changed ETags and live events are never deleted", async () => {
  const original = holiday("legacy"), changed = { ...original, etag: '"new"' };
  const cal = new MemoryCalendar([changed]);
  assert.equal((await run(cal, [remove("2026-12-01", original)]))[0].state, "conflict"); assert.equal(cal.writes, 0);
  const live = holiday("live", undefined, undefined, { summary: "Live show" });
  const forged = { ...dayEvent(live), editable: true };
  const other = new MemoryCalendar([live]);
  assert.equal((await run(other, [{ date: "2026-12-01", action: "remove", events: [forged] }]))[0].state, "conflict"); assert.equal(other.writes, 0);
  assert.equal(editableClosedDay({ ...original, start: { dateTime: "2026-12-01T19:00:00+09:00" } }), false);
});
test("duplicate holiday entries are removed together without changing other appointments", async () => {
  const a = holiday("a"), b = holiday("b"), live = holiday("live", undefined, undefined, { summary: "Live show" });
  const cal = new MemoryCalendar([a, b, live]);
  assert.equal((await run(cal, [remove("2026-12-01", a, b)]))[0].state, "applied");
  assert.deepEqual((await cal.list("2026-12-01", "2026-12-02")).map(e => e.id), ["live"]);
});
test("a missing retained copy is never reported as a completed split on retry", async () => {
  const original = holiday("legacy", "2026-12-01", "2026-12-04"), cal = new MemoryCalendar([original]), op = randomUUID();
  const changes = [remove("2026-12-02", original)]; await run(cal, changes, op);
  const copy = (await cal.list("2026-12-01", "2026-12-04"))[0]; await cal.remove(copy.id, copy.etag);
  assert.equal((await run(cal, changes, op))[0].state, "unknown");
});
test("month ranges are independent of local timezone and handle leap years", () => {
  assert.deepEqual(monthRange("2028-02"), { start: "2028-02-01", end: "2028-03-01" });
  assert.deepEqual(monthRange("2026-12"), { start: "2026-12-01", end: "2027-01-01" });
  assert.throws(() => monthRange("2026-13"));
});
