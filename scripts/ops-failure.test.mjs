import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

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
      const data = JSON.parse(init.body);
      if (data.deliveryStatus !== 'failed') throw Error('Failure was not recorded');
      return Response.json({ id: 'test-notice' });
    }
    return Response.json({ contents: [{ id: 'test-notice', kind: 'social-notices', platform: 'x', deliveryStatus: 'approved', isPublished: true, postText: 'Test event notice' }] });
  };`);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /posted=0 skipped=0 failed=1/);
});
