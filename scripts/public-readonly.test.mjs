import test from "node:test";
import assert from "node:assert/strict";
import { checkPublicSite, checkAdminSite } from "./check-public-readonly.mjs";
const commit = "1".repeat(40);
function fixture({
  broken = "",
  redirect = "",
  badCommit = false,
  unprotected = false,
} = {}) {
  const requests = [];
  const fetcher = async (input, options) => {
    const url = new URL(input);
    requests.push([options.method, url.href]);
    assert.ok(["GET", "HEAD"].includes(options.method));
    assert.equal(options.headers, undefined, "No credentials are sent");
    if (url.pathname === broken) return new Response(null, { status: 404 });
    if (url.pathname === redirect)
      return new Response(null, {
        status: 302,
        headers: { location: "https://untrusted.invalid/secret" },
      });
    if (url.pathname === "/_bassic-build.json")
      return Response.json({
        run: 1,
        commit: badCommit ? "2".repeat(40) : commit,
      });
    if (url.pathname === "/api/session")
      return Response.json({ authenticated: false });
    if (url.pathname.startsWith("/api/"))
      return new Response(null, { status: unprotected ? 200 : 401 });
    if (options.method === "HEAD") return new Response(null, { status: 200 });
    return new Response(
      '<html><head><title>Bassic.</title></head><body><img src="/photo.jpg"><source srcset="/mobile.jpg"><a href="/other/">Other</a><a href="https://www.facebook.com/events/123456/">Social</a></body></html>',
    );
  };
  return { fetcher, requests };
}
test("production checks only read pages/assets and skip external social links", async () => {
  const { fetcher, requests } = fixture();
  const result = await checkPublicSite({
    baseUrl: "https://fixture.invalid",
    paths: ["/"],
    expectedCommit: commit,
    fetcher,
  });
  assert.equal(result.resources, 3);
  assert.ok(
    requests.every(([, url]) => new URL(url).hostname === "fixture.invalid"),
  );
});
test("a missing photo, stale release and unsafe redirect fail the check", async () => {
  for (const options of [
    { broken: "/photo.jpg" },
    { badCommit: true },
    { redirect: "/photo.jpg" },
  ]) {
    const { fetcher, requests } = fixture(options);
    await assert.rejects(
      checkPublicSite({
        baseUrl: "https://fixture.invalid",
        paths: ["/"],
        expectedCommit: commit,
        fetcher,
      }),
      /点検に失敗/,
    );
    assert.ok(
      requests.every(([, url]) => new URL(url).hostname === "fixture.invalid"),
    );
  }
});
test("admin checks require the login gate without logging in or writing", async () => {
  const { fetcher, requests } = fixture();
  assert.deepEqual(
    await checkAdminSite({ baseUrl: "https://fixture.invalid", fetcher }),
    { protectedRoutes: 3 },
  );
  assert.ok(requests.every(([method]) => method === "GET"));
  await assert.rejects(
    checkAdminSite({
      baseUrl: "https://fixture.invalid",
      fetcher: fixture({ unprotected: true }).fetcher,
    }),
    /ログイン保護/,
  );
});
