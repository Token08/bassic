import assert from "node:assert/strict";
import test from "node:test";
import { parseDateFromText, parseDateTimeValue } from "../admin-app/lib/facebook-event-time.ts";

test("Facebook timestamps convert to Tokyo time including a date change", () => {
  assert.deepEqual(parseDateTimeValue("2026-11-10T17:30:00Z"), { date: "2026-11-11", time: "02:30" });
  assert.deepEqual(parseDateTimeValue("2026-11-10T19:00:00+09:00"), { date: "2026-11-10", time: "19:00" });
  assert.deepEqual(parseDateTimeValue("2026-02-30T19:00:00+09:00"), { date: "", time: "" });
});

test("flyer text selects START instead of opening or closing time", () => {
  assert.deepEqual(parseDateFromText("2026年11月10日 18:30 OPEN / 19:00 START 21:00 END"), { date: "2026-11-10", startTime: "19:00" });
  assert.deepEqual(parseDateFromText("2026/11/10 開演 午後７：００"), { date: "2026-11-10", startTime: "19:00" });
});

test("ambiguous dates and times remain unset", () => {
  assert.deepEqual(parseDateFromText("2026/11/10 18:30 OPEN"), { date: "2026-11-10", startTime: "" });
  assert.deepEqual(parseDateFromText("2026/11/10 19:00 START / 20:00 START"), { date: "2026-11-10", startTime: "" });
  assert.deepEqual(parseDateFromText("2026/11/10 / 2026/11/11 19:00 START"), { date: "", startTime: "" });
  assert.equal(parseDateFromText("11月10日 19:00 START").date, "");
});

test("Japanese Facebook metadata with a trailing year supplies the date without guessing START", () => {
  assert.deepEqual(parseDateFromText("福岡市で金曜日, 8月 26 2022に開催する音楽イベント"), { date: "2022-08-26", startTime: "" });
  assert.deepEqual(parseDateFromText("福岡市で 2月 30 2026に開催"), { date: "", startTime: "" });
});
