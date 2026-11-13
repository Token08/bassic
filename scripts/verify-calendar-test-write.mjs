import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { google } from "googleapis";
import { upsertCalendarEvents } from "./calendar-upsert.mjs";
import { packEventRecord, mergeEventRecords } from "../lib/event-storage.mjs";
import { calendarDescription } from "../lib/calendar-event-content.mjs";

const productionCalendar = "bpi41sabm94gp0sni0ps7vajkc@group.calendar.google.com";
const testCalendarName = "Bassic QA (private)";
const calendarId = process.env.BASSIC_QA_CALENDAR_ID?.trim();
const credentialFile = process.env.BASSIC_QA_CALENDAR_CREDENTIAL_FILE;

if (!calendarId?.endsWith("@group.calendar.google.com") ||
    [productionCalendar, process.env.GOOGLE_CALENDAR_ID, process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID].includes(calendarId)) {
  throw new Error("店舗用とは別のテストカレンダーのIDを BASSIC_QA_CALENDAR_ID に設定してください。");
}
if (!credentialFile) {
  throw new Error("テスト用サービスアカウントの鍵ファイルを BASSIC_QA_CALENDAR_CREDENTIAL_FILE に設定してください。");
}

const credentials = JSON.parse(await readFile(credentialFile, "utf8"));
const auth = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ["https://www.googleapis.com/auth/calendar"]
});
const calendar = google.calendar({ version: "v3", auth });
const { data: target } = await calendar.calendars.get({ calendarId });
assert.equal(target.id, calendarId);
assert.equal(target.summary, testCalendarName, "テスト用カレンダーの名前を確認してください。");

const syncTag = "bassic-qa-" + randomUUID();
const key = "facebook-9000000000000001";
const timeZone = "Asia/Tokyo";
const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const dateTime = (hour) => `${date}T${hour}:00:00`;
const sync = (hour, endHour) => {
  const [event] = mergeEventRecords([], [{ ...packEventRecord({
    title: "[Bassic QA] Calendar sync", date, startTime: `${hour}:00`, endTime: `${endHour}:00`,
    sourceUrl: "https://www.facebook.com/events/9000000000000001/", image: { url: "https://images.example.invalid/poster.png" }
  }), id: "private-qa-record" }]);
  return upsertCalendarEvents({
  calendar, calendarId, syncTag,
  entries: [{
    key,
    sourceId: "9000000000000001",
    body: {
      summary: event.title,
      description: calendarDescription(event),
      start: { dateTime: `${event.date}T${event.startTime}:00`, timeZone },
      end: { dateTime: `${event.date}T${event.endTime}:00`, timeZone },
      visibility: "private"
    }
  }]
  });
};

async function listRunEvents() {
  const { data } = await calendar.events.list({ calendarId, privateExtendedProperty: `syncTag=${syncTag}`, showDeleted: false });
  assert.ok(!data.nextPageToken, "テスト予定の件数が想定を超えました。");
  return (data.items || []).filter((item) => item.extendedProperties?.private?.syncTag === syncTag &&
    item.extendedProperties?.private?.syncKey === key);
}

try {
  assert.deepEqual(await sync("19", "20"), { inserted: 1, updated: 0, unchanged: 0 });
  const first = await listRunEvents();
  assert.equal(first.length, 1);
  assert.ok(first[0].id);
  assert.match(first[0].description, /画像: https:\/\/images.example.invalid\/poster.png/);
  assert.equal(Date.parse(first[0].start.dateTime), Date.parse(dateTime("19") + "+09:00"));
  assert.deepEqual(await sync("20", "21"), { inserted: 0, updated: 1, unchanged: 0 });
  assert.deepEqual(await sync("20", "21"), { inserted: 0, updated: 0, unchanged: 1 });
  const updated = await listRunEvents();
  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, first[0].id);
  assert.equal(Date.parse(updated[0].start.dateTime), Date.parse(dateTime("20") + "+09:00"));
} finally {
  for (const item of await listRunEvents()) {
    await calendar.events.delete({ calendarId, eventId: item.id, sendUpdates: "none" });
  }
  assert.equal((await listRunEvents()).length, 0);
}
console.log("テストカレンダーで予定の追加・日時変更・再実行を確認し、テスト予定を削除しました。");
