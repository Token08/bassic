import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function run(script, mock) {
  return spawnSync(process.execPath, ["--input-type=module", "--eval", `${mock}\nawait import('./scripts/${script}');`], {
    cwd: new URL("../", import.meta.url),
    encoding: "utf8",
    timeout: 15000,
    env: {
      ...process.env,
      MICROCMS_SERVICE_DOMAIN: "test",
      MICROCMS_API_KEY: "test",
      GOOGLE_CALENDAR_SYNC_DRY_RUN: "true",
      X_ACCESS_TOKEN: "test"
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
