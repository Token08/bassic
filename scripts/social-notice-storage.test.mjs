import test from "node:test";
import assert from "node:assert/strict";
import { packSocialNoticeRecord, decodeSocialNoticeRecord } from "../lib/social-notice-storage.mjs";

test("draft text, platform and external poster round-trip without CMS media or select fields", () => {
  const notice = { title: "Live X", platform: "x", image: { url: "https://lookaside.fbsbx.com/poster", alt: "出演者" }, postText: "スタッフが編集\nSTART 19:00", sourceEventId: "12345678", deliveryStatus: "draft", isPublished: false };
  const stored = packSocialNoticeRecord({ ...notice, id: "old", __isFallback: true });
  assert.equal(stored.image, undefined);
  assert.equal(stored.platform, undefined);
  assert.deepEqual(decodeSocialNoticeRecord({ ...stored, id: "new" }), { ...notice, id: "new" });
});

test("legacy drafts remain readable, and a JSON record overrides stale physical fields", () => {
  const legacy = { id: "old", kind: "social-notices", postText: "Legacy staff edit", body: "Original body", image: null };
  assert.deepEqual(decodeSocialNoticeRecord(legacy), legacy);
  const stored = { ...legacy, ...packSocialNoticeRecord({ postText: "Current staff edit", deliveryStatus: "posted", externalPostId: "posted-id", image: null }) };
  assert.equal(decodeSocialNoticeRecord(stored).postText, "Current staff edit");
  assert.equal(decodeSocialNoticeRecord(stored).externalPostId, "posted-id");
  assert.equal(decodeSocialNoticeRecord(stored).image, null);
});

test("malformed versioned drafts stop processing", () => {
  assert.throws(() => decodeSocialNoticeRecord({ kind: "social-notices", body: '{"bassicSocialNoticeVersion":1,' }));
  assert.throws(() => decodeSocialNoticeRecord({ kind: "social-notices", body: '{"bassicSocialNoticeVersion":2,"notice":{}}' }));
});

test("removal keeps a recoverable draft but marks it out of normal operation", () => {
  const notice = { postText: "Staff copy", image: null, deliveryStatus: "draft", isPublished: false };
  const decoded = decodeSocialNoticeRecord({ ...packSocialNoticeRecord(notice, { removed: true }), id: "removed" });
  assert.equal(decoded.__removed, true);
  assert.equal(decoded.postText, "Staff copy");
});
