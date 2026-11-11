import assert from "node:assert/strict";
import test from "node:test";
import { fetchWithTimeout } from "../admin-app/lib/fetch-with-timeout.ts";

function pendingFetch(_url, { signal }) {
  return new Promise((_resolve, reject) => {
    const abort = () => reject(new DOMException("Request aborted", "AbortError"));
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
}

test("an external cancellation signal does not disable the request timeout", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = pendingFetch;
  try {
    const external = new AbortController();
    await assert.rejects(fetchWithTimeout("https://example.invalid/", { signal: external.signal }, 20), { name: "AbortError" });
    assert.equal(external.signal.aborted, false, "The helper must not abort the caller's controller");
  } finally {
    globalThis.fetch = original;
  }
});

test("caller cancellation and an already-aborted signal both stop the request", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = pendingFetch;
  try {
    const external = new AbortController();
    const request = fetchWithTimeout("https://example.invalid/", { signal: external.signal });
    external.abort();
    await assert.rejects(request, { name: "AbortError" });
    await assert.rejects(fetchWithTimeout("https://example.invalid/", { signal: external.signal }), { name: "AbortError" });
  } finally {
    globalThis.fetch = original;
  }
});
