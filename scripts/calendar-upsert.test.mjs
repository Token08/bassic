import assert from "node:assert/strict";
import test from "node:test";
import { upsertCalendarEvents } from "./calendar-upsert.mjs";

const syncTag = "bassic-test";
const entry = {
  key: "facebook-1234567890", sourceId: "1234567890",
  body: { summary: "Test event", start: { dateTime: "2026-12-01T19:00:00", timeZone: "Asia/Tokyo" }, extendedProperties: { private: { sourceId: "1234567890", sourceType: "facebook" } } }
};
function sync(events, entries = [entry]) {
  return upsertCalendarEvents({ calendar: { events }, calendarId: "test-calendar", syncTag, entries });
}

test("updates the legacy synchronized event, preserving its ID and unrelated properties", async () => {
  const calls = [];
  const old = { id: "legacy-id", summary: "Old title", extendedProperties: { private: { syncTag, sourceId: entry.sourceId, unrelated: "keep" }, shared: { note: "keep" } } };
  const result = await sync({
    list: async () => ({ data: { items: [old] } }),
    patch: async call => calls.push(call),
    insert: async () => assert.fail("must not insert a duplicate"),
    delete: async () => assert.fail("must never delete an event")
  });
  assert.equal(result.updated, 1);
  assert.equal(calls[0].eventId, "legacy-id");
  assert.equal(calls[0].requestBody.extendedProperties.private.unrelated, "keep");
  assert.deepEqual(calls[0].requestBody.extendedProperties.shared, { note: "keep" });
});

test("retry after a lost insert response does not duplicate or rewrite the event", async () => {
  const items = [];
  let calls = 0;
  const api = {
    list: async () => ({ data: { items } }),
    insert: async ({ requestBody }) => { items.push(requestBody); calls++; throw Error("response lost"); },
    patch: async () => assert.fail("unchanged event should not be rewritten")
  };
  await assert.rejects(sync(api), /response lost/);
  const result = await sync(api);
  assert.equal(calls, 1);
  assert.equal(result.unchanged, 1);
  assert.match(items[0].id, /^[0-9a-f]{64}$/);
});

test("reads every list page before writing and leaves unmentioned and manual events intact", async () => {
  const calls = [];
  const api = {
    list: async ({ pageToken }) => {
      calls.push(pageToken || "first");
      return { data: pageToken ? { items: [{ id: "manual" }] } : { items: [], nextPageToken: "second" } };
    },
    insert: async () => { assert.deepEqual(calls, ["first", "second"]); },
    delete: async () => assert.fail("must not delete manual or missing events")
  };
  assert.equal((await sync(api)).inserted, 1);
});

test("pagination failure aborts before any write", async () => {
  await assert.rejects(sync({
    list: async ({ pageToken }) => { if (pageToken) throw Error("unavailable"); return { data: { items: [], nextPageToken: "next" } }; },
    insert: async () => assert.fail("must not write with an incomplete existing-event list")
  }), /unavailable/);
});

test("duplicate legacy identities abort before any write", async () => {
  const owned = id => ({ id, extendedProperties: { private: { syncTag, sourceId: entry.sourceId } } });
  await assert.rejects(sync({
    list: async () => ({ data: { items: [owned("one"), owned("two")] } }),
    patch: async () => assert.fail("ambiguous events must not be changed")
  }), /重複/);
});

test("an insert collision is reconciled only when the existing event belongs to this source", async () => {
  const conflict = Object.assign(Error("conflict"), { code: 409 });
  let requested;
  const api = {
    list: async () => ({ data: { items: [] } }),
    insert: async ({ requestBody }) => { requested = requestBody; throw conflict; },
    get: async () => ({ data: { ...requested, start: { ...requested.start, dateTime: "2026-12-01T19:00:00+09:00" } } }),
    patch: async () => assert.fail("matching event must not be rewritten")
  };
  assert.equal((await sync(api)).unchanged, 1);
  api.get = async () => ({ data: { id: requested.id, extendedProperties: { private: { syncTag: "someone-else" } } } });
  await assert.rejects(sync(api), /conflict/);
});
