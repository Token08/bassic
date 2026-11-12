import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validatePdf, storePdf, maxPdfBytes } from "../admin-app/lib/pdf-upload.ts";

const bytes = await readFile(new URL("../public/assets/pdf/equipment-rental-list.pdf", import.meta.url));
const file = new File([bytes], "equipment.pdf", { type: "application/pdf" });

test("validates real PDF, rejects renamed files, empty files and oversize files", async () => {
  assert.equal(await validatePdf(file), "");
  for (const invalid of [new File(["HTML"], "list.pdf"), new File([bytes], "list.html"), new File([], "empty.pdf"), new File([new Uint8Array(maxPdfBytes + 1)], "large.pdf")]) assert.notEqual(await validatePdf(invalid), "");
});

test("upload verifies bytes, reuses identical files, handles retries and refuses preview writes", async () => {
  const savedEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  let stored = false, writes = 0, corrupt = false, failWrite = false, race = false;
  Object.assign(process.env, { GITHUB_OWNER: "fixture", GITHUB_REPO: "fixture", GITHUB_DISPATCH_TOKEN: "fixture", VERCEL_ENV: "production" });
  globalThis.fetch = async (input, init) => {
    assert.match(String(input), /^https:\/\/api.github.com\/repos\/fixture\/fixture\/contents\/public\/assets\/pdf\/uploads\/[a-f0-9]{64}\.pdf/);
    if (init.method === "GET") return stored ? new Response(corrupt ? "wrong bytes" : bytes) : new Response(null, { status: 404 });
    assert.equal(init.method, "PUT"); writes++;
    assert.equal(JSON.parse(init.body).content, bytes.toString("base64"));
    assert.equal(JSON.parse(init.body).branch, "main");
    if (failWrite) return new Response(null, { status: 403 });
    stored = true;
    return Response.json({}, { status: race ? 422 : 201 });
  };
  try {
    const first = await storePdf(file);
    assert.match(first.url, /^https:\/\/raw.githubusercontent.com\/fixture\/fixture\/main\/public\/assets\/pdf\/uploads\/[a-f0-9]{64}\.pdf$/);
    assert.deepEqual(await storePdf(file), first);
    assert.equal(writes, 1, "Repeating the same PDF must not add commits");
    corrupt = true; await assert.rejects(storePdf(file)); corrupt = false;
    stored = false; failWrite = true; await assert.rejects(storePdf(file)); failWrite = false;
    race = true; assert.deepEqual(await storePdf(file), first);
    const before = writes; process.env.VERCEL_ENV = "preview";
    await assert.rejects(storePdf(file)); assert.equal(writes, before);
  } finally { globalThis.fetch = originalFetch; process.env = savedEnv; }
});
