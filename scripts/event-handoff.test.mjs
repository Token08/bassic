import assert from "node:assert/strict";
import test from "node:test";
import { calendarDraftUrl, xPostUrl } from "../admin-app/lib/event-handoff.ts";
import { calendarDescription } from "../lib/calendar-event-content.mjs";

test("calendar draft preserves Japanese content, JST and image links without making writes", () => {
  const url = new URL(calendarDraftUrl({ title: "Bassic ライヴ & DJ", date: "2026-12-12", startTime: "19:00", endTime: "22:00", imageUrl: "https://example.com/poster.png?a=1&b=2", sourceUrl: "https://www.facebook.com/events/12345678/", price: "3,000円", reservation: "メール予約" }));
  assert.equal(url.origin, "https://calendar.google.com");
  assert.equal(url.pathname, "/calendar/r/eventedit");
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("dates"), "20261212T100000Z/20261212T130000Z");
  assert.equal(url.searchParams.get("text"), "Bassic ライヴ & DJ");
  assert.match(url.searchParams.get("details"), /画像: https:\/\/example.com\/poster.png\?a=1&b=2/);
  assert.equal(url.searchParams.get("stz"), "Asia/Tokyo");
});
test("calendar draft handles midnight, next-day endings and a two-hour default", () => {
  const input = { title: "Night live", date: "2026-12-31", startTime: "23:30" };
  assert.equal(new URL(calendarDraftUrl(input)).searchParams.get("dates"), "20261231T143000Z/20261231T163000Z");
  assert.equal(new URL(calendarDraftUrl({ ...input, endTime: "02:00" })).searchParams.get("dates"), "20261231T143000Z/20261231T170000Z");
  assert.equal(new URL(calendarDraftUrl({ ...input, startTime: "00:30" })).searchParams.get("dates"), "20261230T153000Z/20261230T173000Z");
  assert.equal(new URL(calendarDraftUrl({ ...input, startTime: "9:00", endTime: "11:00" })).searchParams.get("dates"), "20261231T000000Z/20261231T020000Z");
});
test("calendar does not generate a link for missing or impossible dates/times", () => {
  const input = { title: "Live", date: "2026-12-12", startTime: "19:00" };
  for (const patch of [{ title: "" }, { date: "2026-02-30" }, { date: "" }, { startTime: "" }, { startTime: "24:00" }, { startTime: "OPEN 19:00" }, { endTime: "bad" }])
    assert.equal(calendarDraftUrl({ ...input, ...patch }), "");
});
test("X opens the user's exact edited text without posting or changing URL parameters", () => {
  const text = "編集済み\nBassic & DJ #福岡\nhttps://example.com/?a=1&b=2";
  const url = new URL(xPostUrl(text));
  assert.equal(url.origin, "https://x.com");
  assert.equal(url.pathname, "/intent/tweet");
  assert.equal(url.searchParams.get("text"), text);
  assert.equal([...url.searchParams].length, 1);
});

test("calendar descriptions share confirmed content and preserve public URL prefixes", () => {
  const details = calendarDescription({ sourceUrl: "https://m.facebook.com/events/12345678/?ref=share", image: { url: "/assets/poster.jpg" }, startTime: "9:00", openTime: "08:30", performers: "Artist A", price: "3,000円", reservation: "メール予約" }, "https://example.com/bassic/");
  assert.match(details, /START 09:00/);
  assert.match(details, /OPEN 08:30/);
  assert.match(details, /Artist A/);
  assert.match(details, /3,000円/);
  assert.match(details, /メール予約/);
  assert.match(details, /イベント詳細: https:\/\/www.facebook.com\/events\/12345678\//);
  assert.match(details, /画像: https:\/\/example.com\/bassic\/assets\/poster.jpg/);
  assert.doesNotMatch(details, /ref=share/);
});
