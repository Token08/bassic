import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { packEventRecord } from "../lib/event-storage.mjs";

function run(script, mock, env = {}) {
  return spawnSync(process.execPath, ["--input-type=module", "--eval", `${mock}\nawait import('./scripts/${script}');`], {
    cwd: new URL("../", import.meta.url),
    encoding: "utf8",
    timeout: 15000,
    env: {
      ...process.env,
      MICROCMS_SERVICE_DOMAIN: "test",
      MICROCMS_API_KEY: "test",
      GOOGLE_CALENDAR_SYNC_DRY_RUN: "true",
      GOOGLE_CALENDAR_CLEAR_BEFORE_SYNC: "false",
      X_ACCESS_TOKEN: "test",
      ...env
    }
  });
}

test("calendar stops on a CMS error instead of using stale file events", () => {
  const result = run("sync-google-calendar.mjs", `globalThis.fetch = async () => new Response('{}', { status: 503 });`);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /カレンダー同期を停止しました \(503\)/);
});

test("calendar rejects a malformed CMS response", () => {
  const result = run("sync-google-calendar.mjs", `globalThis.fetch = async () => Response.json({});`);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /応答形式が不正/);
});

test("calendar accepts a valid empty CMS list without writes", () => {
  const result = run("sync-google-calendar.mjs", `globalThis.fetch = async (_url, init) => {
    if (init?.method && init.method !== 'GET') throw Error('Unexpected write');
    return Response.json({ contents: [] });
  };`);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /同期対象イベントがありません/);
});

test("calendar reads the new JSON record and prefers it over the migrated legacy event", () => {
  const event = { title: "Updated JSON live", date: "2099-12-12", startTime: "19:00", sourceType: "facebook", sourceUrl: "https://www.facebook.com/events/12345678/", image: { url: "https://images.example.invalid/poster.png" }, isPublished: true };
  const compact = { ...packEventRecord(event), id: "new" };
  const legacy = { ...event, id: "old", title: "Old legacy live" };
  const result = run("sync-google-calendar.mjs", `globalThis.fetch = async url => Response.json({contents: String(url).includes('/menu?') ? [${JSON.stringify(compact)}] : [${JSON.stringify(legacy)}]});`, { GOOGLE_CALENDAR_SYNC_CMS_ONLY: "true" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /確認のみ: 1 件/);
  assert.match(result.stdout, /Updated JSON live/);
  assert.match(result.stdout, /https:\/\/images.example.invalid\/poster.png/);
  assert.doesNotMatch(result.stdout, /Old legacy live/);
});

test("a malformed new event record stops synchronization before Google authentication", () => {
  const result = run("sync-google-calendar.mjs", `globalThis.fetch = async url => {
    if(!String(url).includes('.microcms.io/')) throw Error('Unexpected Google access');
    return Response.json({contents: String(url).includes('/menu?') ? [{id:'bad',kind:'events',body:'broken'}] : []});
  };`, { GOOGLE_CALENDAR_SYNC_CMS_ONLY: "true" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /保存済みイベント/);
});

test("archiving a JSON event preserves its source, poster and legacy migration identity", () => {
  const compact = { ...packEventRecord({ title: "Past JSON live", date: "2000-01-01", sourceUrl: "https://www.facebook.com/events/12345678/", image: { url: "https://images.example.invalid/poster.png" }, isPublished: true }, { legacyId: "original" }), id: "stored" };
  const result = run("archive-past-events.mjs", `globalThis.fetch = async (url, init = {}) => {
    if(init.method === 'PATCH') {
      const data = JSON.parse(init.body), body = JSON.parse(data.body);
      if(!String(url).endsWith('/menu/stored') || body.legacyId !== 'original' || body.event.isPublished !== false || body.event.image.url !== 'https://images.example.invalid/poster.png') throw Error('Archive lost event data');
      return Response.json({id:'stored'});
    }
    return Response.json({contents: String(url).includes('/menu?') ? [${JSON.stringify(compact)}] : []});
  };`, { AUTO_ARCHIVE_PAST_EVENTS: "true", AUTO_ARCHIVE_PAST_EVENTS_DRY_RUN: "false" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Archived Past JSON live/);
});

test("calendar does not feed imported Google Calendar events back into the same calendar", () => {
  const input = join(tmpdir(), `bassic-calendar-${randomUUID()}.json`);
  writeFileSync(input, JSON.stringify({ events: [{ title: "Existing Calendar event", date: "2026-12-01", startTime: "19:00", sourceType: "google_calendar", isPublished: true }] }));
  try {
    const result = run("sync-google-calendar.mjs", `globalThis.fetch = async () => Response.json({ contents: [] });`, { GOOGLE_CALENDAR_SYNC_INPUT: input });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /同期対象イベントがありません/);
    assert.ok(!result.stdout.includes("Existing Calendar event"));
  } finally {
    unlinkSync(input);
  }
});

test("bulk deletion is rejected before fetching data or authenticating", () => {
  const result = run("sync-google-calendar.mjs", `globalThis.fetch = async () => { throw Error('Unexpected fetch'); };`, { GOOGLE_CALENDAR_CLEAR_BEFORE_SYNC: "true" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /カレンダーの一括削除は無効/);
});

test("calendar writes require an explicit target even when a public calendar ID is configured", () => {
  const result = run("sync-google-calendar.mjs", `globalThis.fetch = async () => { throw Error('Unexpected fetch'); };`, {
    GOOGLE_CALENDAR_SYNC_DRY_RUN: "false",
    GOOGLE_CALENDAR_ID: "",
    NEXT_PUBLIC_GOOGLE_CALENDAR_ID: "public@example.invalid"
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /書き込み先の GOOGLE_CALENDAR_ID を明示/);
});

test("SNS delivery failure records the failure and fails the job", () => {
  const result = run("publish-social-notices.mjs", `globalThis.fetch = async (url, init = {}) => {
    if (String(url).includes('api.x.com')) return Response.json({ detail: 'Test delivery failed' }, { status: 503 });
    if (init.method === 'PATCH') {
      const data = JSON.parse(JSON.parse(init.body).body).notice;
      if (data.deliveryStatus !== 'failed') throw Error('Failure was not recorded');
      return Response.json({ id: 'test-notice' });
    }
    return Response.json({ contents: [{ id: 'test-notice', kind: 'social-notices', platform: 'x', deliveryStatus: 'approved', isPublished: true, postText: 'Test event notice' }] });
  };`);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /posted=0 skipped=0 failed=1/);
});
