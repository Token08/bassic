import test from "node:test";
import assert from "node:assert/strict";
import { operationsHealth } from "../lib/operations-health.mjs";
import { publicationDeadline, publicationWaitMs, canLookUpPublication } from "../lib/publication-timing.mjs";
const now = Date.parse("2026-11-15T10:00:00Z"), commit = "a".repeat(40);
function fixture(options = {}) {
  const fetcher = async (input, init = {}) => {
    assert.ok(["GET", "HEAD"].includes(init.method || "GET"));
    const u = new URL(input);
    if (u.hostname !== "api.github.com") assert.equal(init.headers?.Authorization, undefined);
    if (u.hostname === "api.github.com") {
      assert.equal(init.headers.Authorization, "Bearer fixture-token");
      if (options.providerDown) throw Error("SECRET PROVIDER DETAILS");
      if (u.pathname.endsWith("/runs")) {
        const calendar = u.pathname.includes("external-operations");
        const run = { id: calendar ? 2 : 1, run_number: 10, status: options.pending && !calendar ? "in_progress" : "completed", conclusion: !calendar && options.publishFailed ? "failure" : "success", created_at: new Date(now - (options.stale ? 4 * 3600000 : 60000)).toISOString() };
        return Response.json({ workflow_runs: calendar && options.diagnostic ? [{ ...run, id: 3 }, run] : [run] });
      }
      if (u.pathname.includes("/runs/3/jobs")) return Response.json({ jobs: [{ name: "operations", conclusion: "skipped", steps: [] }] });
      const calendar = u.pathname.includes("/runs/2/jobs");
      return Response.json({ jobs: [{ name: calendar ? "operations" : "publish-lolipop-release", conclusion: calendar && (options.otherJobFailed || options.preparationFailed) ? "failure" : "success", steps: options.preparationFailed && calendar ? [] : [{ name: calendar ? "Sync Google Calendar" : "Confirm release served by the production site", conclusion: calendar && options.calendarFailed ? "failure" : "success" }] }] });
    }
    if (u.pathname === "/_bassic-build.json") return Response.json({ run: options.wrongMarker ? 9 : 10, commit });
    if (u.hostname === "www.bassic.jp") return new Response("Bassic", { status: options.siteDown ? 503 : 200 });
    if (u.pathname === "/api/session") return Response.json({ authenticated: false });
    if (u.pathname.startsWith("/api/")) return new Response(null, { status: options.unprotected ? 200 : 401 });
    return new Response("<title>Bassic.</title>");
  };
  return { fetcher, token: "fixture-token", now, calendarExpected: options.disabled !== true };
}
const states = value => Object.fromEntries(value.services.map(s => [s.id, s.state]));
test("health checks independently read site, login gates, confirmed deployment and calendar job", async () => {
  const value = await operationsHealth(fixture());
  assert.equal(value.ok, true);
  assert.deepEqual(states(value), { site: "ok", admin: "ok", publish: "ok", calendar: "ok" });
});
test("site failure and deployment mismatch cannot be reported as success", async () => {
  const value = await operationsHealth(fixture({ siteDown: true, wrongMarker: true }));
  assert.deepEqual(states(value), { site: "error", admin: "ok", publish: "error", calendar: "ok" });
});
test("unprotected API and provider failure stay visible without leaking provider details", async () => {
  const value = await operationsHealth(fixture({ unprotected: true, providerDown: true }));
  assert.equal(value.ok, false);
  assert.equal(states(value).admin, "error");
  assert.equal(states(value).calendar, "unknown");
  assert.doesNotMatch(JSON.stringify(value), /SECRET|fixture-token/);
});
test("diagnostic success does not mask failed calendar synchronization", async () => {
  assert.equal(states(await operationsHealth(fixture({ diagnostic: true, calendarFailed: true }))).calendar, "error");
  assert.equal(states(await operationsHealth(fixture({ otherJobFailed: true }))).calendar, "ok");
  assert.equal(states(await operationsHealth(fixture({ preparationFailed: true }))).calendar, "error");
});
test("pending, failed, stale and explicitly disabled processes are distinguished", async () => {
  assert.equal(states(await operationsHealth(fixture({ pending: true }))).publish, "pending");
  assert.equal(states(await operationsHealth(fixture({ publishFailed: true }))).publish, "error");
  assert.equal(states(await operationsHealth(fixture({ stale: true }))).calendar, "error");
  assert.equal(states(await operationsHealth(fixture({ disabled: true }))).calendar, "disabled");
});
test("reloading a publication cannot restart its waiting window", () => {
  const requested = new Date(now - 16 * 60000).toISOString();
  assert.equal(publicationDeadline(requested, now), Date.parse(requested) + publicationWaitMs);
  assert.ok(publicationDeadline(requested, now) < now);
  assert.equal(publicationDeadline("invalid", now), now);
  assert.equal(canLookUpPublication(requested, now), true);
  assert.equal(canLookUpPublication(new Date(now - 8 * 86400000).toISOString(), now), false);
  assert.equal(canLookUpPublication(new Date(now + 2 * 60000).toISOString(), now), false);
});
