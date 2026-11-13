import { test } from "node:test";
import assert from "node:assert/strict";
import { packEventRecord, mergeEventRecords, decodeEventFromStorage } from "../lib/event-storage.mjs";

test("event fields and Facebook poster URLs round-trip as plain text without media processing", () => {
  const event = { title: "Live ☆", sourceType: "facebook", sourceId: "12345678", date: "2026-12-12", startTime: "19:00", image: { url: "https://lookaside.fbsbx.com/poster?a=1&b=2", alt: "出演者" }, isPublished: true, reservation: "メール\n予約" };
  const packed = packEventRecord({ ...event, id: "old", __isFallback: true, updatedAt: "old" });
  assert.equal(packed.image, undefined);
  assert.equal(packed.sourceType, undefined);
  assert.deepEqual(mergeEventRecords([], [{ ...packed, id: "new" }]), [{ ...event, id: "new" }]);
  assert.equal(event.date, "2026-12-12");
});

test("intentional empty values, a removed poster and unpublished state survive storage", () => {
  const event = { title: "", image: null, performers: "", isPublished: false, price: "" };
  assert.deepEqual(mergeEventRecords([], [{ ...packEventRecord(event), id: "one" }]), [{ ...event, id: "one" }]);
});

test("a migrated Facebook event replaces its legacy version; independent and duplicate entries remain visible", () => {
  const sourceUrl = "https://www.facebook.com/events/12345678/";
  const legacy = [{ id: "old", title: "Old", sourceUrl }, { id: "manual", title: "Independent" }];
  const updated = { ...packEventRecord({ title: "Updated", sourceUrl }), id: "new" };
  assert.deepEqual(mergeEventRecords(legacy, [updated]).map(item => item.id), ["new", "manual"]);
  assert.equal(mergeEventRecords([], [updated, { ...updated, id: "duplicate" }]).length, 2, "Real duplicate identities must not be silently hidden");
});

test("malformed records and colliding physical IDs stop reading instead of losing content", () => {
  assert.throws(() => mergeEventRecords([], [{ id: "bad", kind: "events", body: "broken" }]));
  assert.throws(() => mergeEventRecords([], [{ id: "bad", kind: "events", body: '{"bassicEventVersion":2,"event":{}}' }]));
  assert.throws(() => mergeEventRecords([{ id: "same", title: "Other" }], [{ ...packEventRecord({ title: "One" }), id: "same" }]));
});

test("manual legacy items migrate by ID and removing the new version never resurrects the original", () => {
  const legacy = [{ id: "manual", title: "Manual entry", isPublished: true }];
  const record = { ...packEventRecord({ title: "Updated manual", isPublished: true }, { legacyId: "manual" }), id: "new" };
  assert.deepEqual(mergeEventRecords(legacy, [record]).map(item => item.title), ["Updated manual"]);
  const removed = { ...packEventRecord({ title: "Updated manual", isPublished: false }, { legacyId: "manual", removed: true }), id: "new" };
  assert.deepEqual(mergeEventRecords(legacy, [removed]), []);
});

test("legacy dates and external image metadata remain readable without rewriting old records", () => {
  const image = { url: "https://lookaside.fbsbx.com/poster", alt: "出演者" };
  const legacy = { id: "legacy", sourceType: "bassic-event-v1:" + JSON.stringify({ sourceType: "facebook", image }), image: null, date: "2026-12-11T15:00:00.000Z" };
  assert.deepEqual(mergeEventRecords([legacy], []), [{ ...legacy, sourceType: "facebook", image, date: "2026-12-12" }]);
  assert.deepEqual(decodeEventFromStorage({ sourceType: "bassic-event-v1:{bad" }), { sourceType: "bassic-event-v1:{bad" });
});
