import assert from "node:assert/strict";
import test from "node:test";
import { cmsRequest, ContentStorageError } from "../admin-app/lib/cms-request.ts";

test("a CMS write taking longer than the former eight-second limit can complete", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, { signal }) => {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 8500);
      signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
    });
    return Response.json({ id: "stored-once" });
  };
  try {
    assert.deepEqual(await cmsRequest("https://example.invalid/events", { method: "POST" }, "/events"), { id: "stored-once" });
  } finally { globalThis.fetch = original; }
});

test("failed writes are not retried, and logs do not reveal credentials or event data", async () => {
  const original = globalThis.fetch, originalLog = console.error;
  const logs = []; let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("secret-key and private-event-body"); };
  console.error = (...args) => logs.push(args);
  try {
    await assert.rejects(cmsRequest("https://example.invalid/events", { method: "POST", headers: { "X-API-KEY": "secret-key" }, body: "private-event-body" }, "/events?secret-key"), error => {
      assert.ok(error instanceof ContentStorageError);
      assert.match(error.message, /登録結果を確認できません/);
      assert.match(error.message, /登録も未確認/);
      return true;
    });
    assert.equal(calls, 1, "Never automatically repeat an ambiguous write");
    assert.doesNotMatch(JSON.stringify(logs), /secret-key|private-event-body/);
    assert.equal(logs[0][1].kind, "transport-or-response");
  } finally { globalThis.fetch = original; console.error = originalLog; }
});

test("permission failures remain distinct from an ambiguous connection failure", async () => {
  const original = globalThis.fetch, originalLog = console.error;
  globalThis.fetch = async () => new Response("private upstream body", { status: 403 });
  console.error = () => {};
  try {
    await assert.rejects(cmsRequest("https://example.invalid/events", { method: "POST" }, "/events"), error => error.status === 403 && /書き込み権限/.test(error.message));
  } finally { globalThis.fetch = original; console.error = originalLog; }
});

test("an upstream 504 is identified as an unconfirmed save rather than an input problem", async () => {
  const original = globalThis.fetch, originalLog = console.error;
  globalThis.fetch = async () => new Response("Gateway timeout", { status: 504 });
  console.error = () => {};
  try {
    await assert.rejects(cmsRequest("https://example.invalid/events", { method: "POST" }, "/events"), error => error.status === 504 && /CMS 504/.test(error.message) && /未確認/.test(error.message));
  } finally { globalThis.fetch = original; console.error = originalLog; }
});

test("a caller cancellation is honored even with the longer write allowance", async () => {
  const original = globalThis.fetch, originalLog = console.error;
  const controller = new AbortController(); controller.abort();
  globalThis.fetch = async (_url, { signal }) => { assert.ok(signal.aborted); throw signal.reason; };
  console.error = () => {};
  try {
    await assert.rejects(cmsRequest("https://example.invalid/events", { method: "POST", signal: controller.signal }, "/events"), ContentStorageError);
  } finally { globalThis.fetch = original; console.error = originalLog; }
});
